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
module.exports = function(info, conf){

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
     */
    const set = target => {
        if (!this.util.is(target).object()) throw this.error.type({
            name: info.name,
            type: 'Object',
            data: conf
        });
        target = this.util
            .object(Object.assign({}, Configuration))
            .merge(target);
        Memory.set(this, target);
    };

    this.set('conf', null, { set, get });
    this.conf = conf;

    const conf$ = this.observable.of(this.conf);

    // Validate minimum required configuration values
    const validConf$ = conf$
        // A root must be specified and has to be in fact an existent directory.
        .do(conf => {
            if (!this.util.is(conf.root).string()) throw this.error.type({
                name: `${info.name}#root`,
                type: 'String',
                data: conf.data
            });
        })
        .switchMap(conf => this.util.rx.path(conf.root).isDir())
        .do(isDir => {
            if (!isDir) throw this.error.type({
                name: `${info.name}#root`,
                type: 'Directory',
                data: this.conf.root
            })
        })
        .mapTo(conf$);

    return validConf$.mapTo(this);


    return this.observable
        .of(this.conf)
        .do(conf => {
            console.info('-----', conf)
        })
        .mapTo(this)


}
