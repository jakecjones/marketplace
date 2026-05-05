const path = require('node:path');
const fs = require('node:fs');
const { Registry } = require('./registry');

/**
 * Loader — reads marketplace.config.json and loads each enabled plugin.
 */
class Loader {
  /**
   * @param {string} rootDir - Absolute path to the marketplace root
   */
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.registry = new Registry();
  }

  /**
   * Load all enabled plugins declared in marketplace.config.json.
   * @returns {Registry}
   */
  load() {
    const configPath = path.join(this.rootDir, 'marketplace.config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`marketplace.config.json not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    for (const entry of config.plugins ?? []) {
      if (!entry.enabled) continue;
      this._loadPlugin(entry);
    }

    return this.registry;
  }

  /**
   * Load a single plugin entry from the config.
   * @param {{ name: string, path: string }} entry
   */
  _loadPlugin(entry) {
    const pluginDir = path.resolve(this.rootDir, entry.path);
    const manifestPath = path.join(pluginDir, 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Plugin "${entry.name}" is missing plugin.json at ${manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const indexPath = path.join(pluginDir, 'index.js');

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Plugin "${entry.name}" is missing index.js at ${indexPath}`);
    }

    // The plugin's index.js must export { skills, agents, hooks, mcps }
    const pluginExports = require(indexPath);

    const plugin = {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      skills: pluginExports.skills ?? [],
      agents: pluginExports.agents ?? [],
      hooks: pluginExports.hooks ?? [],
      mcps: pluginExports.mcps ?? [],
    };

    this.registry.register(plugin);
  }
}

module.exports = { Loader };
