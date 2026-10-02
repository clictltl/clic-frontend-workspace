<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ImagePlus, Smile, X } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import type { Choice, MediaSource } from '../../../../shared/types/chatbot';
import { EMOJI_PICKER_SIZE, useEmojiPicker } from '../../../utils/useEmojiPicker';
import { placePopover } from '../../../utils/popover';
import ChoiceMediaView from '../../../../shared/components/ChoiceMediaView.vue';
import MediaSourcePicker from '../../common/MediaSourcePicker.vue';

/** Escolhe o emoji ou a imagem de uma opção (ou remove). Cada escolha é uma action. */
const props = defineProps<{ nodeId: string; choice: Choice }>();

const { t } = useI18n();
const projectStore = useProjectStore();

const IMAGE_POPOVER_SIZE = { width: 280, height: 140 };

const open = ref<'emoji' | 'image' | null>(null);
const emojiBtn = ref<HTMLButtonElement | null>(null);
const imageBtn = ref<HTMLButtonElement | null>(null);
const emojiContainer = ref<HTMLElement | null>(null);
const imageContainer = ref<HTMLElement | null>(null);
const popoverStyle = ref({ top: '0px', left: '0px' });

const emojiPicker = useEmojiPicker(emoji => {
  projectStore.setChoiceMedia(props.nodeId, props.choice.id, { kind: 'emoji', emoji });
  open.value = null;
});

async function toggle(kind: 'emoji' | 'image') {
  open.value = open.value === kind ? null : kind;
  const anchor = kind === 'emoji' ? emojiBtn.value : imageBtn.value;
  if (!open.value || !anchor) return;
  popoverStyle.value = placePopover(anchor.getBoundingClientRect(), kind === 'emoji' ? EMOJI_PICKER_SIZE : IMAGE_POPOVER_SIZE);
  if (kind === 'emoji') {
    await nextTick();
    await emojiPicker.mount(emojiContainer.value);
  }
}

function selectImage(source: MediaSource) {
  projectStore.setChoiceMedia(props.nodeId, props.choice.id, { kind: 'image', source });
  open.value = null;
}

function closeOnOutside(e: Event) {
  const target = e.target as Node;
  const inside = [emojiContainer.value, imageContainer.value, emojiBtn.value, imageBtn.value].some(el => el?.contains(target));
  if (open.value && !inside) open.value = null;
}

onMounted(() => window.addEventListener('mousedown', closeOnOutside));
onBeforeUnmount(() => window.removeEventListener('mousedown', closeOnOutside));
</script>

<template>
  <div class="choice-media-editor">
    <template v-if="choice.media">
      <ChoiceMediaView :media="choice.media" :size="28" />
      <button class="btn-icon danger" :title="t('chatbot.properties.remove_media')" @click="projectStore.setChoiceMedia(nodeId, choice.id, null)">
        <X :size="14" />
      </button>
    </template>
    <template v-else>
      <button ref="emojiBtn" class="btn-icon" :class="{ 'is-active': open === 'emoji' }" :title="t('chatbot.properties.add_emoji')" @click="toggle('emoji')">
        <Smile :size="16" />
      </button>
      <button ref="imageBtn" class="btn-icon" :class="{ 'is-active': open === 'image' }" :title="t('chatbot.properties.add_image')" @click="toggle('image')">
        <ImagePlus :size="16" />
      </button>
    </template>

    <Teleport to="body">
      <div v-show="open === 'emoji'" ref="emojiContainer" class="popover emoji-popover" :style="popoverStyle"></div>
      <div v-if="open === 'image'" ref="imageContainer" class="popover image-popover" :style="popoverStyle">
        <MediaSourcePicker @select="selectImage" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.choice-media-editor { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
.is-active { background: #dbeafe !important; color: #1d4ed8 !important; }
.popover { position: fixed; z-index: 999999; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-radius: 10px; background: white; }
.image-popover { width: 280px; padding: 10px; box-sizing: border-box; }
</style>
