'use strict';

const Configuration = require('../support/configuration');

const Memory = new WeakMap();

/**
* The configuration sent as parameter extended by defaults.
* @name module:feliz#conf
* @type module:Configuration
* @see {@link module:Configuration}
* @example
* ```js
* // Assume this is the default configuration
* // { foo:'bar', baz:true }
* ...
* feliz => {
*     feliz.conf = { foo:false };
*     console.log(feliz.conf); // { foo:false, baz:true }
* }
* ...
* ```
*/
module.exports = function conf(info, conf){

    /**
     * Get current configuration for the instance.
     * @name module:feliz#conf.getter
     * @method
     * @private
     * @return {module:Configuration} The corresponding configuration object
     *                                for the current instance.
     */
    const get = () => Memory.get(this);

    /**
     * Validate configuration, merge it with defaults and set it in memory
     * @name module:feliz#conf.setter
     * @method
     * @private
     * @param {module:Configuration} target - The configuration object to be set.
     * @return {undefined}
     *
     * @todo Validation should be done on each setter call,
     *       but I haven't figured out a way of doing this.
     *       I mean, would you return an observable as value?
     *       will it resolve itself? drop me a line if you figure this out.
     */
    const set = target => {
        if (!this.util.is(target).object()) throw this.error.type({
            name: info.name,
            type: 'Object',
            data: target
        });
        target = this.util
            .object(Object.assign({}, Configuration))
            .merge(target);
        Memory.set(this, target);
    };

    this.set('conf', null, { set, get });
    this.conf = conf;

    // Make sure the root conf is set.
    if (!this.util.is(this.conf.root).string()) throw this.error.type({
        name: `${info.name}#root`,
        type: 'String',
        data: this.conf.root
    });

    const root$ = this.observable
        .of(this.conf.root)
        .switchMap(root => this.util.rx.path(root)
            .isDir()
            .map(isDir => ({root, isDir}))
        )
        .do(item => {
            if (item.isDir === true) return;
            throw this.error.type({
                name: `${info.name}#root`,
                type: 'Directory',
                data: item.root
            })
        });

    return root$;
}
