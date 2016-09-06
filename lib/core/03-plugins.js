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
                const self = {};
                self.name  = plugin.name;
                self.path  = `plugins:${self.name}`;
                self.deps  = dependency_checker.bind(feliz, self);
                self.conf  = configurator.bind(feliz, self);
                feliz.debug(self.path, 'init');
                if (this.indexOf(self.name) !== -1)
                    throw feliz.error(`${self.path} loaded already.`);
                feliz.events.emit(`${self.path}~before`);
                const plugin$ = plugin.call(feliz, self);
                if (!(plugin$ instanceof feliz.observable))
                    throw feliz.error.type({
                        name:`${self.path} return value`,
                        type: 'Observable',
                        data: plugin$
                    });
                return plugin$.do(inst => {
                    if (!feliz.util.is(inst).feliz())
                        throw feliz.error.type({
                            name: `${self.path} resolved value`,
                            type: `${feliz.constructor.name}`,
                            data: inst
                        });
                    feliz = inst;
                    // store the plugin in memory
                    this.push(self.name);
                    Memory.set(feliz, this);
                    // emit relevant events
                    feliz.events.emit(self.path);
                    feliz.debug(self.path, 'load');
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

/**
 * Determines if dependencies of given plugin are declared on conf
 */
function dependency_checker(self, deps){
    if (!this.util.is(deps).array()) throw this.error.type({
        name: `${self.name}:deps`,
        type: 'Array',
        data: deps
    });
    // obtain the plugins declared on configuration.
    const plugins = this.conf.plugins.map(plugin => plugin.name);
    // determine the position the current plugin has on the list.
    const index = plugins.indexOf(self.name);
    // iterate every specified dependency to make sure they are loaded in order.
    deps.forEach(dep => {
        const i = plugins.indexOf(dep);
        if (i === -1)
            throw this.error(`Dependency «${dep}» not satisfied for ${self.path}`);
        if (i < index)
            throw this.error(`Dependency «${dep}» should load after ${self.path}`);
    });
    return true;
}

/**
 * Make sure the plugins' configuration won't override the one defined by the user
 */
function configurator(self, Conf){
    if (!this.util.is(Conf).function()) throw this.error.type({
        name: `${self.name}:Conf`,
        type: 'Function',
        data: Conf
    });
    if (Conf.name !== 'Conf')
        throw this.error(`${self.name}: Expecting «function Conf()», got: ${Conf.name}`);
    let conf = Conf.call(this, self);
    if (!this.conf[self.name]) this.conf = conf;
    else this.conf = this.util.object(conf).merge({ [self.name]: this.conf[self.name] });
    return this.conf[self.name];
}
