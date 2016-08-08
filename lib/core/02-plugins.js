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
 * const plugin = function PluginName(info){ // since the value of `this` is necessary, avoid using ()=>
 *     console.log(`Hello, I'm a plugin an my name's ${info.name}`);
 *     return this.observable.of(this);
 * }
 * const feliz$ => Feliz({ ..., plugins:[plugin] });
 *
 * // will output log on subscription.
 * ```
 */
module.exports = function(info){

    const validate = target => {
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
        return true;
    }

    let feliz = this;

    // validate plugins sent
    validate(this.conf.plugins);

    Memory.set(this, []);

    // define a getter for the plugins.
    const get = () => Memory.get(this);

    this.set('plugins', null, { get });

    const plugin$ = this.observable
        .from(this.conf.plugins)
        .concatMap(plugin => {
            const name  = plugin.name;

            const plugins = feliz.plugins;
            plugins.push(name);
            Memory.set(this, plugins);

            feliz.events.emit(`plugin:${name}~before`);
            return plugin
                .call(feliz, {name})
                .do(instance => {
                    feliz = instance;
                    feliz.events.emit(`plugin:${name}`)
                })
        })

    return plugin$.startWith(feliz).last();
}
