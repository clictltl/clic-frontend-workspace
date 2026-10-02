import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope } from 'vue';
import { HANDLE_OUT, type ChatNode } from '../../types/chatbot';
import { connect } from '../../domain/graph';
import { TYPING_MS, useChatSession } from '../useChatSession';
import { setup } from '../../domain/__tests__/helpers';

function sessionFor(project: ReturnType<typeof setup>['project']) {
  const events: [string, unknown][] = [];
  const scope = effectScope();
  const session = scope.run(() => useChatSession({ getProject: () => project, onEvent: (name, payload) => events.push([name, payload]) }))!;
  return { session, events, scope };
}

describe('useChatSession', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('reveals bot messages one by one, honoring typing time and message delay', () => {
    const ctx = setup();
    const second = ctx.add('message');
    (ctx.message.data as { delay: number }).delay = 2;
    connect(ctx.project, ctx.message.id, HANDLE_OUT, second.id);

    const { session, events } = sessionFor(ctx.project);
    session.start();
    expect(events).toEqual([['preview_start', undefined]]);
    expect(session.messages.value).toHaveLength(0);
    expect(session.isTyping.value).toBe(true);

    vi.advanceTimersByTime(TYPING_MS);
    expect(session.messages.value).toHaveLength(1);
    expect(session.activeNodeId.value).toBe(ctx.message.id);

    vi.advanceTimersByTime(2000 + TYPING_MS - 1); // espera de 2s + digitando…
    expect(session.messages.value).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(session.messages.value).toHaveLength(2);
    expect(session.isEnded.value).toBe(true);
  });

  it('only accepts answers after the question is shown and logs them', () => {
    const ctx = setup();
    const question = ctx.add('open_question');
    connect(ctx.project, ctx.message.id, HANDLE_OUT, question.id);

    const { session, events } = sessionFor(ctx.project);
    session.start();
    session.submit('cedo demais');
    expect(events.map(e => e[0])).toEqual(['preview_start']);

    vi.advanceTimersByTime(TYPING_MS * 2);
    expect(session.isWaitingText.value).toBe(true);
    session.submit('  Ana ');
    expect(events[events.length - 1]).toEqual(['preview_text', { text: 'Ana' }]);
    expect(session.messages.value[session.messages.value.length - 1]).toMatchObject({ from: 'user', text: 'Ana' });
  });

  it('logs choices and stop, and ignores pending timers after stop', () => {
    const ctx = setup();
    const question = ctx.add('choice_question') as ChatNode & { data: { choices: { id: string }[] } };
    connect(ctx.project, ctx.message.id, HANDLE_OUT, question.id);
    const choiceId = question.data.choices[0]!.id;

    const { session, events, scope } = sessionFor(ctx.project);
    session.start();
    vi.advanceTimersByTime(TYPING_MS * 2);
    session.choose(choiceId);
    expect(events[events.length - 1]).toEqual(['preview_choice', { choiceId }]);

    session.stop();
    vi.advanceTimersByTime(10_000);
    expect(session.isActive.value).toBe(false);
    expect(events[events.length - 1]).toEqual(['preview_stop', undefined]);

    scope.stop(); // sem sessão ativa: não registra outro preview_stop
    expect(events.filter(e => e[0] === 'preview_stop')).toHaveLength(1);
  });

  it('uses a snapshot of the project taken at start', () => {
    const ctx = setup();
    const { session } = sessionFor(ctx.project);
    session.start();
    delete ctx.project.nodes[ctx.message.id];
    vi.advanceTimersByTime(TYPING_MS);
    expect(session.messages.value).toHaveLength(1);
  });
});
