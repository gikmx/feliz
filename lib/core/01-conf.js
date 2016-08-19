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
module.exports = function conf(info){

    // Declare the getter/setter and establish the initial value
    this.set('conf', null, {
        set: setter.bind(this),
        get: getter.bind(this)
    });
    this.conf = this.util.object(Configuration).merge(info.conf);

    // Validate root directory
    if (!this.util.is(this.conf.root).string())
        throw this.error.type({ name:'conf.root', type:'String', data:this.conf.root });
    const root$ = this.observable
        .of(this.conf.root)
        .switchMap(root => this.util.rx.path(root)
            .isDir()
            .map(isDir => ({root, isDir}))
        )
        .do(item => {
            this.debug('conf', 'root', item);
            if (item.isDir === true) return;
            throw this.error.type({ name:'conf.root', type:'Directory', data:item.root });
        });

    return root$.mapTo(this);
}

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
function setter(target){
    validator.call(this, target);
    this.debug('conf', 'setter', target);
    Memory.set(this, this.util.object(this.conf || {}).merge(target));
    if (this.events) this.events.emit('core:conf.setter', target);
};

/**
 * Get current configuration for the instance.
 * @name module:feliz#conf.getter
 * @method
 * @private
 * @return {module:Configuration} The corresponding configuration object
 *                                for the current instance.
 */
function getter(){
    const value = Memory.get(this);
    this.debug('conf', 'getter', value);
    return value;
};

/**
 * Validates configuration object.
 * @name module:feliz#path.validator
 * @method
 * @private
 * @param {object} target - The configuration object.
 */
function validator(target){
    if (!this.util.is(target).object())
        throw this.error.type({name:'conf.validator', type:'Object', data:target });
    this.debug('conf', 'validator', target);
    return true;
}

