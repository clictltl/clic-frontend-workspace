export default {
  global: {
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    deleting: 'Deleting...',
    open: 'Open',
    opening: 'Opening...',
    done: 'Done',
    copy: 'Copy',
    copied: 'Copied!',
    project: 'Project',
    unexpected_error: 'Unexpected error.',
    error_saving: 'Error saving.',
    undo: 'Undid',
    redo: 'Redid'
  },
  
  header: {
    made_by: 'by',
    language: 'Language',
    guide: 'Guide',
    info_contact: 'Info and Contact',
    about_clic: 'About CLIC',
    about_desc: 'This tool is part of <strong>CLIC</strong>, an initiative by the Transformative Learning Technologies Lab (TLTL) at Columbia University.',
    full_access: 'Full Access',
    full_access_desc: 'You are using the tool in free mode. If you are an educator and wish to save your projects to the cloud, create classes, and access our Didactic Sequences, request your account via our contact email.',
    bugs_suggestions: 'Bugs and Suggestions',
    bugs_desc: 'Your contribution is very important to the continuous evolution of this project. If you found any errors in the tool or want to send us feedback and improvement suggestions, do not hesitate to contact us.',
    contact: 'Contact:',
    site: 'Website:',
    app_install: 'Install App',
    back_home: 'Back to Home'
  },

  runtime: {
    created_with: 'Created with',
    open_in_editor: 'Open in Editor',
  },

  auth: {
    login: 'Log in',
    logout: 'Log out',
    welcome_back: 'Welcome back',
    login_prompt: 'Log in to save your projects to the cloud.',
    user_or_email: 'Username or Email',
    type_user: 'Enter your username',
    password: 'Password',
    type_password: 'Enter your password',
    logging_in: 'Logging in...',
    fill_fields: 'Please fill in username and password.',
    invalid_credentials: 'Incorrect username or password.',
    too_many_attempts: 'Too many attempts. Please wait a few minutes.',
    blocked_terms: 'Access blocked. Go to clic.tltlab.org on your browser to accept the Terms of Use.',
    blocked_teacher: 'Access Blocked: Please contact your teacher to regularize your account.',
    login_error: 'Error logging in.'
  },

  file_menu: {
    title: 'File',
    new_project: 'New project',
    unsaved_changes: 'Unsaved changes',
    cloud: 'Cloud',
    save: 'Save',
    save_as: 'Save as...',
    open: 'Open...',
    delete: 'Delete...',
    share: 'Share...',
    publish: 'Publish',
    local: 'Local',
    import_project: 'Import Project',
    export_project: 'Export Project',
    success_save_generic: 'Saved successfully!',
    success_save_project: 'Project saved successfully!',
    error_save_project: 'Error saving project.',
    success_load: 'Project loaded successfully!',
    error_load: 'Error loading project.',
    success_export: '{itemName} exported successfully!',
    error_export: 'Error exporting {itemName}.'
  },

  modals: {
    delete: {
      title: 'Delete {itemName}',
      confirm_named: 'Are you sure you want to delete the {itemName} <strong>"{projectName}"</strong>?',
      confirm_generic: 'Are you sure you want to delete this {itemName}?',
      warning: 'This action is irreversible and data cannot be recovered.',
      btn_confirm: 'Yes, Delete',
      no_selection: 'No project selected.',
      success: 'Project deleted successfully.',
      error: 'Error deleting project.'
    },
    invalid_link: {
      title: 'Invalid or Expired Link',
      description: 'Could not load the shared {itemName}. <br> The link might be incorrect, revoked by the owner, or the {itemName} was deleted.',
      btn_create: 'Got it, create new {itemName}'
    },
    need_save: {
      title: 'Save the {itemName} first',
      description: 'To share or publish, your {itemName} needs to be saved to the cloud.',
      btn_save: 'Save now'
    },
    open: {
      title: 'Open {itemName}',
      description: 'Select a project from the list to continue editing.',
      loading: 'Loading projects...',
      empty: 'You have no saved projects yet.',
      edited_at: 'Edited at: {date}'
    },
    publish: {
      title_publish: 'Publish {itemName}',
      title_published: '{itemName} Published',
      title_paused: 'Publishing Paused',
      status_online: '{itemName} Online',
      status_offline: '{itemName} Offline',
      version: 'Version from {date}',
      last_version: 'Latest version: {date}',
      public_link: 'Public Link',
      hint_update: 'If you made changes, click "Update" to save and sync.',
      hint_restore: 'Do you want to restore the old version or save and publish your new changes?',
      never_published: 'This {itemName} has never been published. Publish it to generate a unique access link.',
      desc_restore: 'Turns the bot back on as it was, without saving current changes',
      btn_disable: 'Disable {itemName}',
      btn_unpublish: 'Unpublish',
      btn_restore: 'Restore Previous',
      btn_update: 'Update',
      btn_publish_new: 'Publish New Version',
      checking: 'Checking status...',
      saving_publishing: 'Saving and publishing...',
      success_new: 'New version published!',
      success_published: 'Published!',
      restoring: 'Restoring version...',
      success_restored: 'Previous version restored and online!',
      warning_unpublish: 'The link will stop working. Continue?',
      unpublishing: 'Disabling...',
      success_unpublished: 'Unpublished.'
    },
    save_as: {
      title_new: 'Save {itemName}',
      title_copy: 'Save as...',
      label_name: '{itemName} Name',
      desc_new: 'Give a name to your new {itemName} to save it.',
      desc_copy: 'Create a copy of this {itemName} with a new name.',
      placeholder_new: 'E.g.: My {itemName}',
      placeholder_copy: 'E.g.: {itemName} v2',
      btn_copy: 'Create Copy',
      error_empty: 'Name cannot be empty.'
    },
    share: {
      title: 'Share {itemName}',
      status_active: 'Sharing Active',
      status_inactive: 'Sharing Disabled',
      desc_active: 'The link is active. Anyone with the URL below can access the {itemName}.',
      desc_inactive: 'The link is disabled. Reactivate to allow access again.',
      empty: 'No link generated previously. Generate a link to let others view this {itemName}.',
      public_link: 'Public Link',
      btn_disable: 'Disable Link',
      btn_reactivate: 'Reactivate Link',
      btn_generate: 'Generate Link',
      checking: 'Checking...',
      success_generated: 'Link generated!',
      success_reactivated: 'Link reactivated successfully!',
      processing: 'Processing...',
      warning_disable: 'The link will become inaccessible. You can reactivate it later.',
      disabling: 'Disabling...',
      success_disabled: 'Link disabled.'
    },
    unsaved: {
      title_export: 'Do you want to export changes?',
      title_save: 'Do you want to save changes?',
      desc_export: 'If you create a new project without exporting, all recent changes will be permanently lost.',
      desc_discard: 'If you discard, all recent changes will be permanently lost.',
      btn_discard: 'Discard',
      btn_export: 'Export'
    }
  },

  messages: {
    export_asset_error: 'Error processing asset {id} for export:',
    missing_project_json: 'project.json file not found in the package.',
    invalid_file_format: 'Invalid or unrecognized file format for security reasons.',
    not_allowed_type: 'File type not allowed. Detected: {mime}',
    compression_failed_size: 'File is still too large after compression ({size}MB).',
    compression_error: 'Error compressing image: {error}',
    file_too_large: 'File too large ({size}MB). The limit is {limit}MB.',
    download_failed: 'Download failed',
    session_expired: 'Session expired. Please log in again to continue.',
    file_not_in_memory: 'File not found in memory: {name}',
    upload_failed: 'Upload failed: {error}',
    save_image_error: 'Error saving image {name}: {error}',
    preview_load_error: 'Error loading preview. Check permissions.',
    student_project: 'Student Project',
    share_load_error: 'Error loading share',
    form_load_error: 'Error loading form',
    submit_response_error: 'Error submitting response',
    fetch_responses_error: 'Error fetching responses'
  },
  
  chatbot: {
    editor: {
      new_block: 'New Block',
      delete_block: 'Delete block',
      input_handle: 'Input handle',
      output_handle: 'Output handle',
      no_content: 'No content',
      no_image: 'No image defined',
      connect_label: "Connect '{label}'",
      connect_condition: 'Connect condition',
      connecting: 'Connecting...',
      connect_hint: 'Click or tap on the input handle (red) of the destination block',
      delete_connection: 'Delete Connection',
      delete_connection_hint: 'Press <kbd>Delete</kbd> or <kbd>Backspace</kbd> to remove this connection',
      tabs: {
        block: 'Block',
        variables: 'Variables',
        preview: 'Preview'
      },
      context_menu: {
        paste: 'Paste Block',
        duplicate: 'Duplicate',
        copy: 'Copy',
        delete: 'Delete',
        no_actions: 'No actions available'
      }
    },
    blocks: {
      start: 'Start',
      message: 'Message',
      openQuestion: 'Open Question',
      choiceQuestion: 'Multiple Choice',
      condition: 'Conditional',
      setVariable: 'Set Variable',
      math: 'Math Operation',
      image: 'Image',
      end: 'End Conversation',
      default_content: {
        message: 'Hello! Welcome to the chatbot.',
        openQuestion: 'What is your name?',
        choiceQuestion: 'Choose an option:',
        condition: 'Checking condition...',
        setVariable: 'Setting variable...',
        math: 'Math operation',
        image: 'Image',
        end: 'Thank you for using the chatbot!'
      }
    },
    properties: {
      empty_state: 'Select a block to edit its properties',
      block_type: 'Block Type',
      label_message: 'Message',
      label_question: 'Question',
      label_final_message: 'Final Message',
      variable_name: 'Variable Name',
      variable_select: 'Select a variable',
      value: 'Value',
      value_placeholder: 'Enter value...',
      variable: 'Variable',
      operation: 'Operation',
      math_placeholder: "Enter a number or {'{{'}variable{'}}'}",
      math_ops: {
        sum: 'Add',
        sub: 'Subtract',
        mult: 'Multiply',
        div: 'Divide'
      },
      save_answer_var: 'Save answer in variable',
      save_answer_none: 'Do not save',
      choices_label: 'Response Options',
      choice_placeholder: 'Option text',
      delete_choice: 'Remove Option',
      add_choice: 'Add Option',
      new_choice: 'New Option',
      conditions_label: 'Conditions',
      delete_condition: 'Remove Condition',
      add_condition: 'Add Condition',
      image_source: 'Image Source',
      image_url_tab: 'Link (URL)',
      image_upload_tab: 'Upload',
      image_url_placeholder: 'https://example.com/photo.jpg',
      image_upload_btn: 'Upload Image',
      image_upload_empty: 'No file',
      image_upload_success: 'File uploaded',
      image_preview: 'Preview:',
      delete_image: 'Remove Image',
      hints: {
        variables: 'Use &#123;&#123;variable&#125;&#125; to insert variable values<br/><strong>Warning:</strong> Avoid formatting only "half" of the variable.',
        variables_other: 'Use &#123;&#123;variable&#125;&#125; to use values from other variables',
        math_target_var: 'Variable that will receive the operation result',
        math_value: 'Use a fixed number or &#123;&#123;variable&#125;&#125; to use another variable\'s value',
        image_url: 'Paste the direct link to an image on the internet.',
        image_upload: 'The image will be saved along with the project.'
      }
    },
    variables: {
      title_new: 'New Variable',
      title_list: 'Created Variables',
      name_placeholder: 'variable_name',
      type_text: 'Text',
      type_number: 'Number',
      empty_state: 'No variables created yet',
      remove_title: 'Remove variable',
      value_placeholder: 'Current value',
      error_empty: 'Enter a name for the variable',
      error_exists: 'A variable with this name already exists',
      error_invalid: 'Invalid name. Use only letters, numbers, and underscore. Cannot start with a number.',
      confirm_delete: 'Do you want to remove the variable "{name}"?'
    },
    messages: {
      preview_denied: 'Access denied or failed to load project.'
    },
    runtime: {
      errors: {
        BLOCK_NOT_FOUND: 'Flow error: block not found.',
        IMAGE_NOT_DEFINED: 'Error: image not defined.',
        INVALID_FLOW: 'Flow error.',
        INVALID_NEXT_BLOCK: 'Flow error: target block not found.',
        NO_CHOICE_TARGET: 'Error: choice without target defined.',
        NO_CHOICES: 'Error: question without choice options.',
        NO_CONDITION_MATCH: 'No condition matched.',
        NO_START_BLOCK: 'Start block not found.',
        START_NO_NEXT: 'Start block without outgoing connection.',
        UNSUPPORTED_BLOCK_TYPE: 'Unsupported block type.'
      },
      preview: {
        title: 'Test your Chatbot',
        desc: 'Click "Start" to talk with your chatbot and test the created flow.',
        btn_start: 'Start Test'
      },
      player: {
        title: 'Start conversation',
        desc: 'Click start to begin',
        btn_start: 'Start'
      },
      chat: {
        placeholder: 'Type your response...',
        send: 'Send',
        restart: 'Restart'
      },
      toolbar: {
        start: 'Start',
        restart: 'Restart',
        stop: 'Stop',
        expand: 'Expand fullscreen',
        collapse: 'Exit fullscreen'
      },
      status: {
        loading: 'Loading chatbot...',
        unavailable: 'Chatbot unavailable.',
        chat_title: 'Chat'
      }
    },
    history: {
      createBlock: 'Block Creation',
      updateBlock: 'Block Update',
      deleteBlock: 'Block Deletion',
      duplicateBlock: 'Block Duplication',
      pasteBlock: 'Block Paste',
      updateBlockPosition: 'Block Movement',
      addVariable: 'Variable Creation',
      updateVariableValue: 'Variable Update',
      removeVariable: 'Variable Deletion',
      createConnection: 'Connection Creation',
      deleteConnection: 'Connection Deletion',
      updateConnection: 'Path Adjustment (Line)'
    }
  },

  graphBuilder: {},

  emojiCoder: {
    setup: {
      prepare_env: 'Choose an activity to start',
      
      basic_title: 'Basic Level',
      basic_desc: 'Learn to move the caramel dog using absolute directions.',
      intermediate_title: 'Intermediate Level',
      intermediate_desc: 'Learn to put yourself in the dog\'s shoes using relative movements.',
      advanced_title: 'Advanced Level',
      advanced_desc: 'Full access to blocks, advanced functions, and custom grids.',
      
      tutorial_title: 'Interactive Tutorial',
      tutorial_basic_desc: 'Learn to move the dog and paint the floor step by step.',
      tutorial_inter_desc: 'Learn to navigate from the dog\'s perspective (Move Forward/Turn).',
      
      sandbox_basic_title: 'Sandbox (Basic)',
      sandbox_basic_desc: 'Create free drawings using movement blocks.',
      sandbox_inter_title: 'Sandbox (Relative)',
      sandbox_inter_desc: 'Program Move Forward, Backward, and Turn movements.',
      sandbox_adv_title: 'Sandbox (Master)',
      sandbox_adv_desc: 'Merge absolute and relative movement in the same project. Create huge challenges!',
      
      grid_fixed: 'Size: 8x8 (Fixed)',
      grid_size: 'Board Size:',
      grid_small: '6x6 (Small)',
      grid_medium: '8x8 (Medium)',
      grid_large: '12x12 (Large)',
      grid_max: '16x16 (Max Challenge)',
      start_btn: 'Start'
    },
    messages: {
      unsaved_confirm: 'You have unsaved changes. Do you really want to go back to the start and lose your progress?',
      preview_denied: 'Access denied or failed to load project.',
      loading_project: 'Loading Project...',
      oops: 'Oops!',
      invalid_token: 'Project not found or invalid link.',
      invalid_data: 'Project file is corrupted.',
      network_error: 'Connection error. Check your internet.',
      unknown_error: 'An unknown error occurred.'
    },
    workspace: {
      loaded_title: 'Coding Environment Loaded!',
      active_lib: 'Active Library:',
      grid_size: 'Grid Size:',
      placeholder: '(Blockly and Canvas will be rendered here)',
      drag_resize: 'Drag to resize',
      actor_alt: 'Turtle'
    },
    blocks: {
      start: 'When start',
      paint: 'Paint',
      move_up: 'Move up',
      move_down: 'Move down',
      move_left: 'Move left',
      move_right: 'Move right',
      define: 'Define',
      call: 'Call',
      defaultFuncName: 'my function',
      move_forward: 'Move forward',
      move_backward: 'Move backward',
      turn_left: 'Turn Left',
      turn_right: 'Turn Right',
      repeat: 'Repeat'
    },
    toolbox: {
      start: 'Start',
      movement: 'Movement',
      movement_absolute: 'Absolute Movement',
      movement_relative: 'Relative Movement',
      actions: 'Actions',
      loops: 'Loops',
      functions: 'Functions'
    },
    player: {
      challenge: 'Challenge {number}',
      go_to_challenge: 'Go to this challenge',
      need_hint: 'Need a hint?',
      hint: 'Hint:',
      success: 'Success!',
      finish_tutorial: 'Finish Tutorial',
      next_challenge: 'Next Challenge →',
      tutorial_completed: 'Tutorial Completed!',
      tutorial_completed_desc: 'You completed all challenges with excellence. You are already a Turtle master and are ready to create your own free projects!',
      save_tip: 'Remember to use the <strong>File > Save</strong> menu to save your solutions before leaving!',
      back_home: 'Back to Home',
      step: 'Step',
      waiting_code: 'Waiting for code...',
      speed: 'Speed',
      reset_world: 'Reset World',
      run_code: 'Run Code',
      resume: 'Resume Execution',
      pause: 'Pause',
      step_by_step: 'Step by Step',
      export_image: 'Export as Image',
      editor_mode: 'Editor Mode',
      full_screen: 'Full Screen',
      default_drawing_name: 'drawing'
    },
    tutorials: {
      grade4: {
        c1: {
          title: 'Go right!',
          desc: 'The turtle needs to reach the green block. Use the → Right block to move!',
          tip: 'Each → Right moves 1 cell. How many times do you need to use it to reach the green?',
          success: 'Congratulations! You moved the turtle to the goal!'
        },
        c2: {
          title: 'Paint a line!',
          desc: 'Paint the 4 blocks in the line. Use Paint and → Right.',
          tip: 'Start by painting where you are, then go right and paint again!',
          success: 'Well done! You painted the entire line!'
        },
        c3: {
          title: 'Use Repeat!',
          desc: 'Paint a line of 6 blocks, but this time use the Repeat block to make it easier!',
          tip: 'Put Paint + Right inside the Repeat. Repeat 6 times!',
          success: 'Perfect! The Repeat block made your code much simpler!'
        },
        c4: {
          title: 'Paint everything!',
          desc: 'Paint all 12 blocks of the 4x3 grid blue. Use all movements!',
          tip: 'Paint row by row or column by column. Use Repeat to make it easier!',
          success: 'Excellent! You painted all blocks in the grid!'
        },
        c5: {
          title: 'Paint the frame!',
          desc: 'Paint only the borders of the 8x8 grid. Do not paint the blocks in the middle!',
          tip: 'Paint the entire top row, then the sides, and finally the bottom row. Use Repeat!',
          success: 'Fantastic! You painted the perfect frame without painting any extra blocks! 🎉'
        }
      },
      grade5: {
        c1: {
          title: 'Reach the goal!',
          desc: 'The turtle needs to reach the green block at the end of the line. Use the Move Forward block to advance!',
          tip: 'Each Move Forward advances 1 step. How many steps to the green block?',
          success: 'You reached the goal! You learned to move the turtle with precision.'
        },
        c2: {
          title: 'Paint the line!',
          desc: 'Paint all 8 blocks in the line. Use Paint and Move Forward.',
          tip: 'Paint the current cell, move forward, paint the next... repeat for all 8 blocks!',
          success: 'Incredible! You painted the entire line — but it was quite a lot of work, right? There is a better way...'
        },
        c3: {
          title: 'Use Repeat!',
          desc: 'Paint the line again — but this time use the Repeat block.',
          tip: 'Put Paint + Move Forward inside the Repeat. How many times do you need to repeat?',
          success: 'Perfect! The Repeat block made the code much smaller and more elegant!'
        },
        c4: {
          title: 'Use a function!',
          desc: 'Use the function that paints an entire line. Call it again to paint the second line!',
          tip: 'Navigate to the next line and call the function again.',
          success: 'Excellent! Functions let you reuse code — define once, use as many times as you want!'
        },
        c5: {
          title: 'Draw a square!',
          desc: 'Paint the perimeter of the square marked on the grid.',
          tip: 'Try: Repeat 4 times — Repeat 2×(Paint + Move Forward), then Turn Right.',
          success: 'Fantastic! You drew a square using code. You are a programmer!'
        },
        c6: {
          title: 'Frame!',
          desc: 'Paint only the edges of the canvas - the complete perimeter.',
          tip: 'Use Repeat for each side. After painting a side, turn to the next one!',
          success: 'Excellent! You created a perfect frame around the canvas!'
        },
        c7: {
          title: 'Change the eyes!',
          desc: 'Change the 2 black blocks to another color!',
          tip: 'Navigate to each black eye and paint. Use the commands to get there!',
          success: 'Perfect! You changed the eyes from black to another color!'
        },
        c8: {
          title: 'Paint the letter E!',
          desc: 'The letter E is in gray. Paint the entire letter with whatever color you want!',
          tip: 'Navigate through each line of the letter. Be careful: paint ONLY the letter!',
          success: 'Incredible! You colored the letter E completely!'
        }
      }
    }
  }
};
