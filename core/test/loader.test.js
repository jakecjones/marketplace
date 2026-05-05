'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Loader } = require('../loader');

const ROOT = path.resolve(__dirname, '..', '..');

test('Loader — loads ux-harness and canopy from marketplace.config.json', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();
  const summary = registry.summary();

  // Both plugins should be registered
  assert.ok(summary.plugins.includes('ux-harness'), 'ux-harness should be registered');
  assert.ok(summary.plugins.includes('canopy'), 'canopy should be registered');
});

test('Loader — ux-harness skills are registered', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();

  assert.ok(registry.getSkill('render-component'), 'render-component skill missing');
  assert.ok(registry.getSkill('capture-input'), 'capture-input skill missing');
  assert.ok(registry.getSkill('stream-response'), 'stream-response skill missing');
});

test('Loader — canopy skills are registered', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();

  assert.ok(registry.getSkill('remember'), 'remember skill missing');
  assert.ok(registry.getSkill('recall'), 'recall skill missing');
  assert.ok(registry.getSkill('fetch-context'), 'fetch-context skill missing');
  assert.ok(registry.getSkill('delegate-agent'), 'delegate-agent skill missing');
});

test('Loader — agents are registered', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();

  assert.ok(registry.getAgent('ux-orchestrator'), 'ux-orchestrator agent missing');
  assert.ok(registry.getAgent('canopy-orchestrator'), 'canopy-orchestrator agent missing');
});

test('Loader — MCPs are registered', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();

  assert.ok(registry.getMcp('ux-harness-mcp'), 'ux-harness-mcp missing');
  assert.ok(registry.getMcp('canopy-mcp'), 'canopy-mcp missing');
});

test('Loader — hooks are registered', () => {
  const loader = new Loader(ROOT);
  const registry = loader.load();

  const beforeSkill = registry.getHooks('beforeSkill');
  assert.ok(beforeSkill.length >= 2, 'Expected at least 2 beforeSkill hooks');

  const onSessionStart = registry.getHooks('onSessionStart');
  assert.ok(onSessionStart.length >= 2, 'Expected at least 2 onSessionStart hooks');

  const onSessionEnd = registry.getHooks('onSessionEnd');
  assert.ok(onSessionEnd.length >= 1, 'Expected at least 1 onSessionEnd hook');
});

test('Loader — throws for missing config', () => {
  const loader = new Loader('/tmp/nonexistent-marketplace');
  assert.throws(() => loader.load(), /marketplace\.config\.json not found/);
});
