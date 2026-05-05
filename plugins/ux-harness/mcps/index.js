/**
 * ux-harness MCP server definition
 *
 * Exposes the ux-harness skills as MCP tools so Claude can invoke them
 * via the Model Context Protocol.
 *
 * Start the server with:
 *   node plugins/ux-harness/mcps/server.js
 *
 * @type {import('../../core/types').McpDefinition}
 */
const uxHarnessMcp = {
  name: 'ux-harness-mcp',
  description:
    'MCP server exposing UX tools (render-component, capture-input, stream-response) to Claude',
  command: 'node',
  args: ['plugins/ux-harness/mcps/server.js'],
  env: {},
};

module.exports = { uxHarnessMcp };
