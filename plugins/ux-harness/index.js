const { renderComponent, captureInput, streamResponse } = require('./skills');
const { uxOrchestrator } = require('./agents');
const { logUxCall, initUxContext } = require('./hooks');
const { uxHarnessMcp } = require('./mcps');

/** @type {import('../core/types').PluginManifest} */
const plugin = {
  name: 'ux-harness',
  version: '0.1.0',
  description:
    'UI/UX interaction harness — renders components, captures input, streams responses',
  skills: [renderComponent, captureInput, streamResponse],
  agents: [uxOrchestrator],
  hooks: [logUxCall, initUxContext],
  mcps: [uxHarnessMcp],
};

module.exports = plugin;
