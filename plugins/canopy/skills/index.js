// In-process memory store (replace with a real persistence layer as needed)
const memoryStore = new Map();

/**
 * remember skill
 *
 * Store a key/value fact in the conversation memory tree.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const remember = {
  name: 'remember',
  description: 'Store a key/value fact in the conversation memory tree',
  inputSchema: {
    type: 'object',
    required: ['key', 'value'],
    properties: {
      key: {
        type: 'string',
        description: 'Dot-separated path key, e.g. "user.preferences.theme"',
      },
      value: {
        description: 'The value to store (any JSON-serialisable type)',
      },
    },
  },
  /**
   * @param {{ key: string, value: unknown }} input
   * @returns {Promise<{ stored: boolean, key: string }>}
   */
  async handler({ key, value }) {
    memoryStore.set(key, value);
    return { stored: true, key };
  },
};

/**
 * recall skill
 *
 * Retrieve stored facts by exact key or prefix.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const recall = {
  name: 'recall',
  description: 'Retrieve stored facts by key or key prefix',
  inputSchema: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        description: 'Exact key or dot-separated prefix, e.g. "user.preferences"',
      },
    },
  },
  /**
   * @param {{ key: string }} input
   * @returns {Promise<{ results: Object }>}
   */
  async handler({ key }) {
    const results = {};
    for (const [k, v] of memoryStore.entries()) {
      if (k === key || k.startsWith(key + '.')) {
        results[k] = v;
      }
    }
    return { results };
  },
};

/**
 * fetch-context skill
 *
 * Fetch a subtree of hierarchical context data by path.
 * In a real integration this would query a vector DB or knowledge graph.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const fetchContext = {
  name: 'fetch-context',
  description: 'Fetch a subtree of hierarchical context data by path',
  inputSchema: {
    type: 'object',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'Slash-separated context path, e.g. "project/docs/architecture"',
      },
      depth: {
        type: 'integer',
        description: 'Maximum depth of the returned subtree',
        default: 3,
      },
    },
  },
  /**
   * @param {{ path: string, depth?: number }} input
   * @returns {Promise<{ path: string, data: Object }>}
   */
  async handler({ path, depth = 3 }) {
    // TODO: integrate with your knowledge graph or vector store
    void depth;
    return { path, data: {} };
  },
};

/**
 * delegate-agent skill
 *
 * Delegate a sub-task to another registered agent.
 *
 * @type {import('../../core/types').SkillDefinition}
 */
const delegateAgent = {
  name: 'delegate-agent',
  description: 'Delegate a sub-task to another registered agent by name',
  inputSchema: {
    type: 'object',
    required: ['agent', 'task'],
    properties: {
      agent: {
        type: 'string',
        description: 'Name of the target agent (must be registered in the marketplace)',
      },
      task: {
        type: 'string',
        description: 'Natural-language description of the sub-task to perform',
      },
      context: {
        type: 'object',
        description: 'Optional context passed to the agent',
        default: {},
      },
    },
  },
  /**
   * @param {{ agent: string, task: string, context?: Object }} input
   * @returns {Promise<{ delegated: boolean, agent: string, task: string }>}
   */
  async handler({ agent, task, context = {} }) {
    // TODO: resolve agent from registry and invoke it
    void context;
    return { delegated: true, agent, task };
  },
};

module.exports = { remember, recall, fetchContext, delegateAgent };
