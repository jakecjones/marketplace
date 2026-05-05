/**
 * @typedef {Object} SkillDefinition
 * @property {string} name - Unique skill identifier
 * @property {string} description - Human-readable description
 * @property {Object} inputSchema - JSON Schema for skill inputs
 * @property {Function} handler - Async function that executes the skill
 */

/**
 * @typedef {Object} AgentDefinition
 * @property {string} name - Agent identifier
 * @property {string} description - What this agent does
 * @property {string[]} skills - Skill names this agent can use
 * @property {Object} [systemPrompt] - Optional system prompt override
 */

/**
 * @typedef {Object} HookDefinition
 * @property {string} event - Hook event name (e.g. 'beforeSkill', 'onSessionStart')
 * @property {number} [priority] - Execution order (lower = earlier); default 50
 * @property {Function} handler - Async function called on the event
 */

/**
 * @typedef {Object} McpDefinition
 * @property {string} name - MCP server identifier
 * @property {string} description - What this MCP server provides
 * @property {string} command - Command used to launch the MCP server
 * @property {string[]} [args] - Arguments for the command
 * @property {Object} [env] - Environment variables for the server
 */

/**
 * @typedef {Object} PluginManifest
 * @property {string} name - Plugin name (must match directory name)
 * @property {string} version - SemVer version string
 * @property {string} description - Human-readable plugin description
 * @property {SkillDefinition[]} [skills]
 * @property {AgentDefinition[]} [agents]
 * @property {HookDefinition[]} [hooks]
 * @property {McpDefinition[]} [mcps]
 */

module.exports = {};
