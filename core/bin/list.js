#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { Loader } = require('../loader');

const rootDir = path.resolve(__dirname, '..', '..');
const loader = new Loader(rootDir);

try {
  const registry = loader.load();
  const summary = registry.summary();

  console.log('\nClaude Marketplace — Registered Resources\n');
  console.log('Plugins:  ', summary.plugins.join(', ') || '(none)');
  console.log('Skills:   ', summary.skills.join(', ') || '(none)');
  console.log('Agents:   ', summary.agents.join(', ') || '(none)');
  console.log('MCPs:     ', summary.mcps.join(', ') || '(none)');

  const hookEvents = Object.keys(summary.hooks);
  if (hookEvents.length) {
    console.log('Hooks:');
    for (const [event, count] of Object.entries(summary.hooks)) {
      console.log(`  ${event}: ${count} handler(s)`);
    }
  } else {
    console.log('Hooks:    (none)');
  }
  console.log('');
} catch (err) {
  console.error('Error loading marketplace:', err.message);
  process.exit(1);
}
