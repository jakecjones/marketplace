/**
 * log-ux-call hook
 *
 * Fires before every skill invocation. Logs the skill name and
 * a timestamp for UX telemetry purposes.
 *
 * @type {import('../../core/types').HookDefinition}
 */
const logUxCall = {
  event: 'beforeSkill',
  priority: 10,
  /**
   * @param {{ skillName: string, input: Object }} context
   */
  async handler({ skillName, input }) {
    console.log(`[ux-harness] beforeSkill: ${skillName}`, JSON.stringify(input));
  },
};

/**
 * init-ux-context hook
 *
 * Fires when a new Claude session starts. Initialises the UX
 * context — theme, locale, and surface identifiers.
 *
 * @type {import('../../core/types').HookDefinition}
 */
const initUxContext = {
  event: 'onSessionStart',
  priority: 20,
  /**
   * @param {{ sessionId: string, metadata?: Object }} context
   */
  async handler({ sessionId, metadata = {} }) {
    // TODO: initialise theme, locale, and surface from metadata
    void sessionId;
    void metadata;
  },
};

module.exports = { logUxCall, initUxContext };
