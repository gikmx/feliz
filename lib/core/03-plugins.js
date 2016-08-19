'use strict';

const Memory = new WeakMap();
/**
 * The loaded plugins list.
 * Internally, the plugin handler executes plugins as if they were core modules; So its
 * mandatory for each plugin function to return an observable of their instance.
 * @name module:feliz#plugins
 * @type array
 * @see {@link module:Configuration.plugins}
 * @example
 * ```js
 * // since the value of `this` is necessary, avoid using ()=>
 * const plugin = function PluginName(info){
 *     console.log(`Hello, I'm a plugin an my name's ${info.name}`);
 *     return this.observable.of(this);
 * }
 * const feliz$ => Feliz({ ..., plugins:[plugin] });
 *
 * // will output log on subscription.
 * ```
 */
module.exports = function(info){

    this.set('plugins', null, {
        set: setter.bind(this, info),
        get: getter.bind(this, info)
    });

    // every time this.conf has an update call the setter to update all plugins
    this.events.on('core:conf.setter', conf => {
        if (!conf.plugins) return;
        this.plugins = conf.plugins;
    });

    // load plugins defined a
    this.debug('feliz:plugins', 'here')
    const plugin$ = setter.call(this, info, this.conf.plugins);

    return plugin$.startWith(this).last();
}

/**
 * Sets a plugin in memory
 * @name module:feliz#plugins.setter
 * @method
 * @private
 */
function setter(info, target){
    validator.call(this, info, target);
    let feliz = this;
    return feliz.observable
        .from(target)
        .concatMap(plugin => {
            feliz.debug(`${info.name}:${plugin.name}`, 'init');
            const plugins = feliz.plugins || [];
            const name    = plugin.name;
            const pinfo   = {name, conf:this.conf[name]};
            if (plugins.indexOf(name) !== -1)
                throw feliz.error(`Plugin '${name}' has been loaded already.`);
            feliz.events.emit(`plugins:${name}~before`, pinfo);
            const feliz$ = plugin.call(feliz, info);
            return plugin
                .call(feliz, info)
                .do(instance => {
                    // force-update the instance value
                    feliz = instance;
                    // store the plugin in memory
                    plugins.push(name);
                    Memory.set(feliz, plugins);
                    // emit relevant events
                    feliz.events.emit('core:plugins.set', pinfo);
                    feliz.events.emit(`plugins:${name}`, pinfo);
                    feliz.debug(`${info.name}:${name}`)
                });
        })
}

/**
 * Gets current plugins from memory
 * @name module:feliz#plugins.getter
 * @method
 * @private
 * @return {module:Configuration.plugins} The plugins send in conf, parsed by context.
 */
function getter(info, target){
    const value = Memory.get(this);
    this.debug(`${info.name}.getter`, value);
    return value;
}

/**
 * Validates plugins sent by the user
 * @name module:feliz#plugins.validator
 * @method
 * @private
 * @param {object} The plugin object to parse
 */
function validator(info, target){
    this.debug(`${info.name}.validator:init`, target);
    if (!this.util.is(target).array())
        throw this.error.type({
            name: `${info.name}#validator`,
            type: 'Array',
            data: target
        });
    target.forEach(plugin => {
        if (!this.util.is(plugin).function())
            throw this.error.type({
                name: `${info.name}#validator.plugin`,
                type: 'Function',
                data: plugin
            });
        if (!plugin.name)
            throw this.error.type({
                name: `${info.name}#validator.plugin`,
                type: 'Function Name',
                data: plugin.name
            });
    });
    this.debug(`${info.name}.validator`, target);
    return true;
}
