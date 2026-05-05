#!/usr/bin/env node
/**
 * canopy MCP server (stdio transport)
 *
 * Implements the Model Context Protocol to expose Canopy skills to Claude.
 * Claude communicates with this process over stdin/stdout using
 * JSON-RPC 2.0 messages.
 *
 * Protocol reference: https://modelcontextprotocol.io/specification
 */
'use strict';

const { remember, recall, fetchContext, delegateAgent } = require('../skills');

const TOOLS = [
  {
    name: 'remember',
    description: remember.description,
    inputSchema: remember.inputSchema,
  },
  {
    name: 'recall',
    description: recall.description,
    inputSchema: recall.inputSchema,
  },
  {
    name: 'fetch-context',
    description: fetchContext.description,
    inputSchema: fetchContext.inputSchema,
  },
  {
    name: 'delegate-agent',
    description: delegateAgent.description,
    inputSchema: delegateAgent.inputSchema,
  },
];

const SKILL_MAP = {
  remember,
  recall,
  'fetch-context': fetchContext,
  'delegate-agent': delegateAgent,
};

/** Send a JSON-RPC response to stdout */
function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

/** Handle a single parsed JSON-RPC request */
async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'canopy-mcp', version: '0.1.0' },
        capabilities: { tools: {} },
      },
    });
    return;
  }

  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params ?? {};
    const skill = SKILL_MAP[name];
    if (!skill) {
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown tool: ${name}` },
      });
      return;
    }
    try {
      const result = await skill.handler(args ?? {});
      send({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result) }] },
      });
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message },
      });
    }
    return;
  }

  // Method not found
  send({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

// Read newline-delimited JSON from stdin
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  const lines = buf.split('\n');
  buf = lines.pop(); // keep any incomplete line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let req;
    try {
      req = JSON.parse(trimmed);
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      continue;
    }
    handleRequest(req).catch((err) => {
      send({ jsonrpc: '2.0', id: req.id ?? null, error: { code: -32603, message: err.message } });
    });
  }
});
