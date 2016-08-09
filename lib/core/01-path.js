'use strict';

const PATH = require('path');
const Memory = new WeakMap();

// If run using the REPL, this won't be set, this is just a failsafe.
if (!process.mainModule) process.mainModule = { filename:__filename }

/**
 * A path resolver extended by defaults
 * @name module:feliz#path
 * @type object
 * @see {@link module:Configuration.path}
 * @todo Allow custom context.
 * @todo Determine if path validation should occur.
 *       Given the nature of the parser (using Node's Path module in its entirety)
 *       it's not possible to ensure that every property is actually a path
 *       ie: `path.ext`. so validation doesn't make sense as of now.
 * @example
 * ```js
 * // Assuming these are the default paths
 * // { ext:'.js', root:'/path/to/app' }
 *
 * // You add some more defaults previous to instantiation
 * const feliz$ = Feliz({
 *   ...
 *   path: { common: { type:'join', args:['${root}', 'common'] } },
 *   ...
 * });
 *
 * feliz$.subscribe(
 *   feliz => {
 *     // and then you add even more.
 *     feliz.path = {
 *       'master': { type:'join', args:['${root}', 'master'] }
 *     };
 *
 *     console.log(feliz.path);
 *     // {
 *     //   ext    : '.js',
 *     //   root   : '/path/to/app',
 *     //   common : '/path/to/app/commmon',
 *     //   master : '/path/to/app/master'
 *     // }
 *   }
 * )
 * ```
 */
module.exports = function path(info){

    /**
     * Validates path objects sent by the user
     * @name module:feliz#path.validator
     * @method
     * @private
     * @param {object} target - The path object to parse
     */
    const validate = target => {
        if (!this.util.is(target).object())
            throw this.error.type({
                name: `${info.name}#path`,
                type: 'Object',
                data: target
            });
        Object.keys(target).map(key => {
            const path = this.conf.path[key];
            if (!this.util.is(path).object())
                throw this.error.type({
                    name: `${info.name}#path:item`,
                    type: 'Object',
                    data: path
                });
            if (!this.util.is(path.type).string())
                throw this.error.type({
                    name: `${info.name}#path:item.type`,
                    type: 'String',
                    data: path.type
                });
            if (!this.util.is(path.args).array())
                throw this.error.type({
                    name: `${info.name}#path:item.args`,
                    type: 'Array',
                    data: path.args
                });
            return path;
        });
        return true;
    }

    /**
     * Determines the context to resolve paths sent in conf.
     * @name module:feliz#path.context
     * @private
     * @type object
     */
    const context = this.util
        .object({
            '__filename': process.mainModule.filename,
            '__dirname' : PATH.dirname(process.mainModule.filename)
        })
        .merge(Object
            .keys(this.conf)
            .filter(key => this.util.is(this.conf[key]).string())
            .reduce((obj, key) => {
                obj[key] = this.conf[key];
                return obj;
            }, {})
        );

    /**
     * Gets current paths from memory
     * @name module:feliz#path.getter
     * @method
     * @private
     * @return {module:Configuration.path} The paths send in conf, parsed by context.
     */
    const get = ()=> Memory.get(this);

    /**
     * Given path configuration, parse it via context and set it to memory.
     * @name module:feliz#path.setter
     * @method
     * @private
     * @return {undefined}
     */
    const set = target => {
        validate(target);
        // Merge current with defaults on conf.
        target = this.util
            .object(Object.assign({}, this.conf.path))
            .merge(target);
        // Convert config to actual paths
        target = Object
            // Convert the object to an array with a 'key' property.
            .keys(target)
            .map(key => Object.assign({key}, target[key]))
            // Generate a resulting object by parsing each item.
            .reduce((obj, cur)=> {
                // Resolve variables according to context
                const args = cur.args
                    .map(arg => this.util.string(arg).template(context));
                // Resolve the path according to command/arguments sent.
                const path = PATH[cur.type].apply(PATH, args);
                // if the key name contains 'dots', create an object from it.
                const value = cur.key
                    .split('.')
                    .reduce((acc, cur, i, arr) => {
                        let val = i === arr.length - 1? path : {};
                        if (!Object.keys(acc).length) acc[cur] = val;
                        else {
                            let ref = arr
                                .slice(0, i)
                                .reduce((o, i) => o[i], acc);
                            ref[cur] = val;
                        }
                        return acc;
                    }, {});
                // join the latest result with accumulator object.
                return this.util.object(obj).merge(value);
            }, {});
        Memory.set(this, target);
    };

    // Make sure the default configuration is well formatted
    validate(this.conf.path);

    // Declare gette/setter and establish the initial value.
    this.set('path', null, {set, get});
    this.path = {};

    // No need of async operations.
    return this.observable.of(this);
}
