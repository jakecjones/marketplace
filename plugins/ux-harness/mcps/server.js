#!/usr/bin/env node
/**
 * ux-harness MCP server (stdio transport)
 *
 * Implements the Model Context Protocol to expose UX skills to Claude.
 * Claude communicates with this process over stdin/stdout using
 * JSON-RPC 2.0 messages.
 *
 * Protocol reference: https://modelcontextprotocol.io/specification
 */
'use strict';

const { renderComponent, captureInput, streamResponse } = require('../skills');

const TOOLS = [
  {
    name: 'render-component',
    description: renderComponent.description,
    inputSchema: renderComponent.inputSchema,
  },
  {
    name: 'capture-input',
    description: captureInput.description,
    inputSchema: captureInput.inputSchema,
  },
  {
    name: 'stream-response',
    description: streamResponse.description,
    inputSchema: streamResponse.inputSchema,
  },
];

const SKILL_MAP = {
  'render-component': renderComponent,
  'capture-input': captureInput,
  'stream-response': streamResponse,
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
        serverInfo: { name: 'ux-harness-mcp', version: '0.1.0' },
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
