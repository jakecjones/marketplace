/**
 * ux-orchestrator agent
 *
 * Coordinates multi-step UX flows:
 *   1. Render an initial component
 *   2. Capture user input
 *   3. Stream Claude's response back to the surface
 *
 * @type {import('../../core/types').AgentDefinition}
 */
const uxOrchestrator = {
  name: 'ux-orchestrator',
  description:
    'Coordinates multi-step UX flows: prompt → render → capture → stream response',
  skills: ['render-component', 'capture-input', 'stream-response'],
  systemPrompt: {
    text: `You are a UX orchestration agent. Your role is to:
1. Render appropriate UI components for the current context.
2. Capture user input when needed.
3. Stream your responses token-by-token to the UI surface.
Always use the available skills rather than returning raw text.`,
  },
};

module.exports = { uxOrchestrator };
