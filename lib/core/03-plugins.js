'use strict';

const Memory    = new WeakMap();
const Internals = new WeakMap();

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
module.exports = function(info) {

    this.set('plugins', null, { get: getter.bind(this) });

    const plugin$ = this.plugins.load(this.conf.plugins || []);
    return plugin$
        .startWith(this)
        .last();
}

/**
  Gets current plugins from memory
 * @name module:feliz#plugins.getter
 * @method
 * @private
 * @return {module:Configuration.plugins} The plugins send in conf, parsed by context.
 */
function getter(target) {
    const plugins = Memory.get(this) || new Plugins(this);
    this.debug('plugins', 'getter', plugins);
    return plugins;
}

class Plugins extends Array {

    constructor(feliz){
        super()
        Internals.set(this, feliz);
        feliz.debug('plugins', 'constructor');
    }

    load(plugins){
        let feliz = Internals.get(this);
        validator.call(feliz, plugins);
        return feliz.observable
            .from(plugins)
            .concatMap(plugin => {
                feliz.debug(`plugins:${plugin.name}`, 'init');
                const name = plugin.name;
                if (this.indexOf(name) !== -1)
                    throw feliz.error(`Plugin '${name}' loaded already.`);
                feliz.events.emit(`plugins:${name}~before`);
                const plugin$ = plugin.call(feliz, plugin);
                if (!(plugin$ instanceof feliz.observable))
                    throw feliz.error.type({
                        name:`plugins:${name} return value`,
                        type: 'Observable',
                        data: plugin$
                    });
                return plugin$.do(inst => {
                    if (!feliz.util.is(inst).feliz())
                        throw feliz.error.type({
                            name: `plugins:${name} resolved value`,
                            type: `${feliz.constructor.name}`,
                            data: inst
                        });
                    feliz = inst;
                    // store the plugin in memory
                    this.push(name);
                    Memory.set(feliz, this);
                    // emit relevant events
                    feliz.events.emit(`plugins:${name}`);
                    feliz.debug(`plugins:${name}`, 'load');
                });
            })
    }
}

/**
 * Validates plugins sent by the user
 * @name module:feliz#plugins.validator
 * @method
 * @private
 * @param {object} The plugin object to parse
 */
function validator(target) {
    if (!this.util.is(target).array())
        throw this.error.type({ name:'plugins', type:'Array', data:target });
    target.forEach(plugin => {
        if (!this.util.is(plugin).function() || !this.util.is(plugin.name).string())
            throw this.error.type({
                name: 'plugins',
                type: 'Named Function',
                data: plugin
            });
    });
    this.debug('plugins', 'validator', target);
    return true;
}

