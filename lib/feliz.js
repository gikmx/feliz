'use strict';

const PATH = require('path');

const {Observable} = require('rxjs/Rx');
const FelizError   = require('feliz.error');
const FelizUtil    = require('feliz.util');
const Debug        = require('debug');

const Attributes = require('./support/attributes');
const Package    = require('../package');

/**
 * The wrapper simply consists in a function that - when called - returns an observable
 * containing either the instance (with among other stuff an initialize server) and/or
 * a stream of errors found either on the initialization stage or afterwards.
 *
 * @example
 * ```js
 * const Feliz = require('feliz');
 * const feliz$ = Feliz({root:'./app'});
 * feliz$.subscribe(
 *     feliz => console.log('feliz is ready'),
 *     error => console.error(error);
 * );
 * ```
 *
 * if you wish to have more than once instance of Feliz running, use 'new'
 * to instantantiate it, otherwise the same instance will be returned every time.
 * __Please bear in mind this is an experimental feature.__ So it's recommended to
 * only use the non-instantiated version of feliz.
 *
 * @example
 * ```js
 * const Feliz = require('feliz');
 * const feliz$1 = new Feliz({root:'./app'});
 * const feliz$2 = new Feliz({root:'./your-other-app'});
 * ...
 * ```
 *
 * @module feliz
 * @see {@link module:Configuration}
 * @param {module:Configuration} conf - An object containig the configuration for each part
 *                               of the framework.
 * @return {Observable} Either the instance, or a stream of errors.
 */
 module.exports = (function Feliz(conf={}){

    let feliz = this;

    // if already instantiated, don't redeclare.
    if (this.set !== undefined) return Observable.of(feliz);

    /**
     * The instance setter, if you want to add new members to the feliz instance, this is
     * the way of doing it. Avoid directly modifying the instance.
     *
     * __Note__: If you send a setter/getter as attribute, the `value`, and
     *           the attributes `writable` and `configurable` will be ignored.
     *
     * @name module:feliz#set
     * @method
     * @param {string}     key   - The member name.
     * @param {mixed}      value - The value that will be assigned to given member.
     * @param {Attributes} attr  - The attributes the member will have.
     * @return {mixed} The assigned value.
     *
     * @see {@link Attributes}
     */
    function set(key, value=null, attr={}){
        if (!module.exports.util.is(attr).object()) attr = {};
        let prop = Object.assign({}, Attributes, attr);
        if (!prop.get && !prop.set) prop = Object.assign({value}, prop);
        else {
            delete prop.writable
            delete prop.configurable
        }
        Object.defineProperty(this, key, prop);
        return value;
    }
    Object.defineProperty(this, 'set', Object.assign({value:set}, Attributes));

    /**
     * @name module:feliz#package
     * @type object
     * @see {@link module:feliz.package|feliz.package}
     */
    this.set('package', module.exports.package, {enumerable:false});

    /**
     * @name module:feliz#observable
     * @type object
     * @see {@link module:feliz.observable|feliz.observable}
     */
    this.set('observable', module.exports.observable, {enumerable:false});

    /**
     * @name module:feliz#error
     * @type object
     * @see {@link module:feliz.error|feliz.error}
     */
    this.set('error', module.exports.error);

    /**
     * @name module:feliz#util
     * @see {@link module:feliz.util|feliz.util}
     * @return {object}
     */
    this.set('util', module.exports.util);

    const module$ = Observable
        .of(PATH.join(__dirname, 'core'))
        .mergeMap(path => this.util.rx.path(path).readdir())
        .toArray()
        .concatMap(paths => paths.sort())
        .concatMap(path => {
            const func = require(path);
            const name = PATH
                .basename(path, PATH.extname(path))
                .replace(/^\d+\-/, '')
            // When the events module is ready, start auto triggering.
            if (feliz.events) feliz.events.emit(`core:${name}~before`);
            if (feliz.debug) feliz.debug(name, 'init');
            const instance$ = func.call(feliz, {name, path, conf});
            return instance$.do(instance => {
                feliz = instance;
                if (feliz.events) feliz.events.emit(`core:${name}`);
                if (feliz.debug) feliz.debug(name, 'load');
            });
        });

    return module$.last()
}).bind(
    new (class Feliz extends Object {})
)

/**
 * The parsed representation of the `package.json` file.
 * @name module:feliz.package
 * @see {@link https://github.com/gikmx/feliz/blob/master/package.json|package.json}
 * @return {object}
 */
module.exports.package = Package;

/**
 * Error handling methods
 * @name module:feliz.error
 * @kind external
 * @see {@link http://github.com/gikmx/feliz.error|feliz.error}
 * @return {object}
 */
module.exports.error = FelizError;

/**
 * General utilities
 * @name module:feliz.util
 * @kind external
 * @see {@link http://github.com/gikmx/feliz.util|feliz.util}
 * @return {object}
 */
module.exports.util = FelizUtil;

/**
 * A constructor to build observables
 * @name module:feliz.observable
 * @kind external
 * @see {@link http://github.com/ReactiveX/rxjs|RxJS}
 * @return {object}
 */
module.exports.observable = Observable;

/**
 * An utility to debug your code
 * @name module:feliz.debug
 * @kind external
 * @see {@link http://github.com/visionmedia/debug|debug}
 * @return {function}
 */
module.exports.debug = Debug;
