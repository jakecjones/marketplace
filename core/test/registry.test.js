'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Registry } = require('../registry');

test('Registry — register and retrieve a plugin', () => {
  const registry = new Registry();
  registry.register({
    name: 'test-plugin',
    skills: [
      {
        name: 'my-skill',
        description: 'test',
        inputSchema: {},
        handler: async () => ({}),
      },
    ],
    agents: [{ name: 'my-agent', description: 'test', skills: ['my-skill'] }],
    hooks: [{ event: 'beforeSkill', priority: 5, handler: async () => {} }],
    mcps: [{ name: 'my-mcp', description: 'test', command: 'node', args: [] }],
  });

  assert.equal(registry.getSkill('my-skill').name, 'my-skill');
  assert.equal(registry.getAgent('my-agent').name, 'my-agent');
  assert.equal(registry.getHooks('beforeSkill').length, 1);
  assert.equal(registry.getMcp('my-mcp').name, 'my-mcp');
});

test('Registry — duplicate plugin throws', () => {
  const registry = new Registry();
  const plugin = { name: 'dupe', skills: [], agents: [], hooks: [], mcps: [] };
  registry.register(plugin);
  assert.throws(() => registry.register(plugin), /already registered/);
});

test('Registry — duplicate skill throws', () => {
  const registry = new Registry();
  const skill = { name: 'dup-skill', description: '', inputSchema: {}, handler: async () => {} };
  registry.register({ name: 'plugin-a', skills: [skill], agents: [], hooks: [], mcps: [] });
  assert.throws(
    () => registry.register({ name: 'plugin-b', skills: [skill], agents: [], hooks: [], mcps: [] }),
    /already registered/
  );
});

test('Registry — hooks sorted by priority', () => {
  const registry = new Registry();
  registry.register({
    name: 'hook-plugin',
    skills: [],
    agents: [],
    hooks: [
      { event: 'beforeSkill', priority: 50, handler: async () => {} },
      { event: 'beforeSkill', priority: 10, handler: async () => {} },
      { event: 'beforeSkill', priority: 30, handler: async () => {} },
    ],
    mcps: [],
  });
  const hooks = registry.getHooks('beforeSkill');
  assert.equal(hooks[0].priority, 10);
  assert.equal(hooks[1].priority, 30);
  assert.equal(hooks[2].priority, 50);
});

test('Registry — summary returns correct keys', () => {
  const registry = new Registry();
  registry.register({
    name: 'summary-plugin',
    skills: [{ name: 's1', description: '', inputSchema: {}, handler: async () => {} }],
    agents: [{ name: 'a1', description: '', skills: [] }],
    hooks: [{ event: 'onSessionStart', handler: async () => {} }],
    mcps: [{ name: 'm1', description: '', command: 'node', args: [] }],
  });
  const s = registry.summary();
  assert.deepEqual(s.plugins, ['summary-plugin']);
  assert.deepEqual(s.skills, ['s1']);
  assert.deepEqual(s.agents, ['a1']);
  assert.deepEqual(s.mcps, ['m1']);
  assert.equal(s.hooks.onSessionStart, 1);
});

test('Registry — missing event returns empty hooks array', () => {
  const registry = new Registry();
  assert.deepEqual(registry.getHooks('nonexistent'), []);
});

test('Registry — getMcp returns null for unknown mcp', () => {
  const registry = new Registry();
  assert.equal(registry.getMcp('nope'), null);
});
