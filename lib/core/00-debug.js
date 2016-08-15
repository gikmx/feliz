'use strict';

const Debug = require('debug');

const Debuggers = new WeakMap();
const Handlers  = new WeakMap();

module.exports = function(info){
    this.set('debug', Debugger.bind(this));
    return this.observable.of(this);
}

/**
 * A wrapper for [debug](http://github.com/visionmedia/debug) to ensure namespacing.
 * If no params sent (besides the name) it returns a debugger function instead.
 * @name module:feliz#debug
 * @type function
 * @param {string} name - An identifier to be used by the debug handler.
 * @param {mixed} [...params] - The element to be debugged.
 * @see {@link https://github.com/visionmedia/debug|debug}
 * @return {mixed} A debugger function or null
 * @example
 * ```js
 * feliz.debug('test', 'hello world'); // will debug as 'feliz:test'
 * // or
 * const debug = feliz.debug('test');
 * debug('hello world');
 * ```
 */
function Debugger(type, ...params){
    if (type === null) type = '';
    if (!this.util.is(type).string()) throw this.error.type({
        name: 'debug#type',
        type: 'String',
        data: type
    });
    let handlers = Handlers.get(this);
    if (!handlers) handlers = {};
    if (!handlers[type]) {
        handlers[type] = Handler.bind(this, type);
        Handlers.set(this, handlers);
    }
    if (!params.length) return handlers[type];
    return handlers[type].apply(this, params);
}


function Handler(type, ...params){
    type = `feliz:${type}`;
    let debuggers = Debuggers.get(this);
    if (!debuggers) debuggers = {};
    if (!debuggers[type]){
        debuggers[type] = Debug(type);
        Debuggers.set(this, debuggers);
    }
    // if the parameter is an object or an array, prepend a new line and examine it.
    params = params.reduce((result, param, i) => {
        const is = this.util.is(param);
        if (!is.object() && !is.array()) result.push(param);
        else result.splice(i, 0, '\n', this.util.examine(param));
        return result;
    }, []);
    return debuggers[type].apply(debuggers[type], params);
}
