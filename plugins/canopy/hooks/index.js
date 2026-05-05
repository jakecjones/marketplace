/**
 * restore-memory hook
 *
 * Fires when a new Claude session starts. Loads any persisted
 * memory tree back into the in-process store.
 *
 * @type {import('../../core/types').HookDefinition}
 */
const restoreMemory = {
  event: 'onSessionStart',
  priority: 10,
  /**
   * @param {{ sessionId: string, metadata?: Object }} context
   */
  async handler({ sessionId, metadata = {} }) {
    // TODO: load persisted memory for this session from a store (DB, file, etc.)
    void sessionId;
    void metadata;
  },
};

/**
 * persist-memory hook
 *
 * Fires when a Claude session ends. Serialises the current
 * memory tree to persistent storage.
 *
 * @type {import('../../core/types').HookDefinition}
 */
const persistMemory = {
  event: 'onSessionEnd',
  priority: 90,
  /**
   * @param {{ sessionId: string }} context
   */
  async handler({ sessionId }) {
    // TODO: persist in-memory store for this session
    void sessionId;
  },
};

/**
 * inject-context hook
 *
 * Fires before every skill invocation. Injects relevant canopy
 * context into the skill input so skills have access to memory.
 *
 * @type {import('../../core/types').HookDefinition}
 */
const injectContext = {
  event: 'beforeSkill',
  priority: 20,
  /**
   * @param {{ skillName: string, input: Object }} context
   */
  async handler({ skillName, input }) {
    // TODO: enrich input with relevant canopy context
    void skillName;
    void input;
  },
};

module.exports = { restoreMemory, persistMemory, injectContext };
