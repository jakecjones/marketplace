/**
 * Registry — tracks all loaded plugins and provides lookup by type.
 *
 * @example
 * const registry = new Registry();
 * registry.register(plugin);
 * registry.getSkill('render-component');
 */
class Registry {
  constructor() {
    /** @type {Map<string, import('./types').SkillDefinition>} */
    this.skills = new Map();
    /** @type {Map<string, import('./types').AgentDefinition>} */
    this.agents = new Map();
    /** @type {Map<string, import('./types').HookDefinition[]>} */
    this.hooks = new Map();
    /** @type {Map<string, import('./types').McpDefinition>} */
    this.mcps = new Map();
    /** @type {Map<string, Object>} */
    this.plugins = new Map();
  }

  /**
   * Register a fully-loaded plugin manifest.
   * @param {import('./types').PluginManifest} plugin
   */
  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);

    for (const skill of plugin.skills ?? []) {
      if (this.skills.has(skill.name)) {
        throw new Error(`Skill "${skill.name}" is already registered (conflict in plugin "${plugin.name}").`);
      }
      this.skills.set(skill.name, skill);
    }

    for (const agent of plugin.agents ?? []) {
      if (this.agents.has(agent.name)) {
        throw new Error(`Agent "${agent.name}" is already registered (conflict in plugin "${plugin.name}").`);
      }
      this.agents.set(agent.name, agent);
    }

    for (const hook of plugin.hooks ?? []) {
      const list = this.hooks.get(hook.event) ?? [];
      list.push(hook);
      list.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
      this.hooks.set(hook.event, list);
    }

    for (const mcp of plugin.mcps ?? []) {
      if (this.mcps.has(mcp.name)) {
        throw new Error(`MCP "${mcp.name}" is already registered (conflict in plugin "${plugin.name}").`);
      }
      this.mcps.set(mcp.name, mcp);
    }
  }

  /** @param {string} name */
  getSkill(name) {
    return this.skills.get(name) ?? null;
  }

  /** @param {string} name */
  getAgent(name) {
    return this.agents.get(name) ?? null;
  }

  /**
   * Return all hooks registered for the given event, sorted by priority.
   * @param {string} event
   */
  getHooks(event) {
    return this.hooks.get(event) ?? [];
  }

  /** @param {string} name */
  getMcp(name) {
    return this.mcps.get(name) ?? null;
  }

  /** Return a plain-object summary suitable for CLI output. */
  summary() {
    return {
      plugins: [...this.plugins.keys()],
      skills: [...this.skills.keys()],
      agents: [...this.agents.keys()],
      hooks: Object.fromEntries(
        [...this.hooks.entries()].map(([event, hooks]) => [event, hooks.length])
      ),
      mcps: [...this.mcps.keys()],
    };
  }
}

module.exports = { Registry };
