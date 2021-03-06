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

    // Declare gette/setter and establish the initial value.
    this.set('path', null, {
        set: setter.bind(this),
        get: getter.bind(this)
    });
    this.path = this.conf.path;

    // everytime the configuration has an update, make sure the path is updated too.
    this.events.on('core:conf.setter', function(e, conf){
        if (!conf.path) return;
        this.debug('path', 'update', conf.path);
        this.path = conf.path;
    });

    // No need of async operations.
    return this.observable.of(this);
}

/**
 * Gets current paths from memory
 * @name module:feliz#path.getter
 * @method
 * @private
 * @return {module:Configuration.path} The paths send in conf, parsed by context.
 */
function getter(info){
    const value = Memory.get(this);
    this.debug('path', 'getter', value);
    return value;
}

/**
 * Given path configuration, parse it via context and set it to memory.
 * @name module:feliz#path.setter
 * @method
 * @private
 * @return {undefined}
 */
function setter(target){
    this.debug('path', 'setter:init', target);
    validator.call(this, target);
    target = converter.call(this, target);
    let value = Memory.get(this) || {};
    value = this.util.object(value).merge(target)
    Memory.set(this, value);
    this.debug('path', 'setter', value);
}

/**
 * Validates path objects sent by the user
 * @name module:feliz#path.validator
 * @method
 * @private
 * @param {object} target - The path object to parse
 */
function validator(target){
    if (!this.util.is(target).object())
        throw this.error.type({ name: 'conf.path', type:'Object', data:target });
    const paths = Object.keys(target).map(key => {
        const path = target[key];
        if (!this.util.is(path).object())
            throw this.error.type({ name:'path', type:'Object', data:path });
        if (!this.util.is(path.type).string())
            throw this.error.type({ name:'path.type', type:'String', data:path.type });
        if (!this.util.is(path.args).array())
            throw this.error.type({ name:'path.args', type:'Array', data:path.args });
        return path;
    });
    this.debug('path','validator', paths.length, paths);
    return true;
}

function converter(target){
    target = Object
        .keys(target)
        .map(key => Object.assign({key}, target[key]))
        // Generate a resulting object by parsing each item.
        .reduce((obj, cur)=> {
            // Resolve variables according to context
            const args = cur.args.map(arg => this.util
                .string(arg)
                .template(contexter.call(this))
            );
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
    this.debug('path', 'converter', target);
    return target;
}

/**
 * Determines the context to resolve paths sent in conf.
 * @name module:feliz#path.contexter
 * @private
 * @method
 * @return {object} the current context
 */
function contexter(info){
    const value = this.util
        .object({
            '__filename': process.mainModule.filename,
            '__dirname' : PATH.dirname(process.mainModule.filename),
            'root'      : this.conf.root,
        })
        .merge(this.path);
    this.debug('path', 'contexter', value);
    return value;
}

