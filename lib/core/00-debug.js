'use strict';

const Debug = require('debug');

const handlers = {};

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
    if (!this.util.is(type).string()) throw this.error.type({
        name: 'debug#type',
        type: 'String',
        data: type
    });
    type = `feliz:${type}`;
    const handler = this.util.is(handlers[type]).function()? handlers[type] : Debug(type);
    if (!params.length) return handler;
    return handler.apply(handler, params);
}
