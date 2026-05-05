/**
 * canopy MCP server definition
 *
 * Exposes the canopy skills as MCP tools so Claude can invoke them
 * via the Model Context Protocol.
 *
 * Start the server with:
 *   node plugins/canopy/mcps/server.js
 *
 * @type {import('../../core/types').McpDefinition}
 */
const canopyMcp = {
  name: 'canopy-mcp',
  description:
    'MCP server exposing Canopy tools (remember, recall, fetch-context, delegate-agent) to Claude',
  command: 'node',
  args: ['plugins/canopy/mcps/server.js'],
  env: {},
};

module.exports = { canopyMcp };
