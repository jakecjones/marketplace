const { remember, recall, fetchContext, delegateAgent } = require('./skills');
const { canopyOrchestrator } = require('./agents');
const { restoreMemory, persistMemory, injectContext } = require('./hooks');
const { canopyMcp } = require('./mcps');

/** @type {import('../core/types').PluginManifest} */
const plugin = {
  name: 'canopy',
  version: '0.1.0',
  description:
    'Umbrella context layer — conversation memory, hierarchical retrieval, multi-agent orchestration',
  skills: [remember, recall, fetchContext, delegateAgent],
  agents: [canopyOrchestrator],
  hooks: [restoreMemory, persistMemory, injectContext],
  mcps: [canopyMcp],
};

module.exports = plugin;
