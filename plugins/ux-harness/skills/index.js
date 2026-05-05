/**
 * render-component skill
 *
 * Renders a named UI component with the supplied props. In a real
 * integration this would call your surface layer (React, Vue, native, etc.).
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const renderComponent = {
  name: 'render-component',
  description: 'Render a named UI component with the supplied props',
  inputSchema: {
    type: 'object',
    required: ['component'],
    properties: {
      component: {
        type: 'string',
        description: 'Name of the component to render (e.g. "MessageBubble")',
      },
      props: {
        type: 'object',
        description: 'Key/value props passed to the component',
        default: {},
      },
    },
  },
  /**
   * @param {{ component: string, props?: Object }} input
   * @returns {Promise<{ rendered: boolean, component: string, props: Object }>}
   */
  async handler({ component, props = {} }) {
    // TODO: wire this to your actual surface rendering layer
    return { rendered: true, component, props };
  },
};

/**
 * capture-input skill
 *
 * Presents a prompt to the user and returns their free-text response.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const captureInput = {
  name: 'capture-input',
  description: 'Present a prompt to the user and capture their text response',
  inputSchema: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        description: 'The question or instruction shown to the user',
      },
      placeholder: {
        type: 'string',
        description: 'Optional input placeholder text',
        default: '',
      },
    },
  },
  /**
   * @param {{ prompt: string, placeholder?: string }} input
   * @returns {Promise<{ input: string }>}
   */
  async handler({ prompt, placeholder = '' }) {
    // TODO: wire this to your actual input-capture layer
    void placeholder;
    void prompt;
    return { input: '' };
  },
};

/**
 * stream-response skill
 *
 * Streams a Claude response token-by-token to the UI surface.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const streamResponse = {
  name: 'stream-response',
  description: 'Stream a Claude response token-by-token to the UI surface',
  inputSchema: {
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        description: 'Full text to stream',
      },
      delayMs: {
        type: 'number',
        description: 'Delay between tokens in milliseconds',
        default: 0,
      },
    },
  },
  /**
   * @param {{ text: string, delayMs?: number }} input
   * @returns {Promise<{ streamed: boolean, length: number }>}
   */
  async handler({ text, delayMs = 0 }) {
    // TODO: wire to your actual streaming/websocket layer
    void delayMs;
    return { streamed: true, length: text.length };
  },
};

module.exports = { renderComponent, captureInput, streamResponse };
