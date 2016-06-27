'use strict';

const Rx    = require('rxjs/Rx');
const Merge = require('lodash.merge');

module.exports = instance => {

    const util = {};

    util.is = target => ({
        object    : ()=> target && target.constructor === Object,
        string    : ()=> target && target.constructor === String,
        array     : ()=> target && target.constructor === Array,
        number    : ()=> target && target.constructor === Number,
        date      : ()=> target && target.constructor === Date,
        regex     : ()=> target && target.constructor === RegExp,
        function  : ()=> target && target.constructor === Function,
        null      : ()=> target === null,
        undefined : ()=> target === undefined
    });

    util.object = target => {
        if (!util.is(target).object()) throw instance.error.type({
            name: 'util.object',
            type: 'Object',
            data: !target? target : target.constructor.name
        });
        return {
            merge: function(){
                const args = Array.prototype.slice.call(arguments);
                args.unshift(target);
                return Merge.apply(null, args);
            }
        }
    };

    util.string = target => {
        if (!util.is(target).string()) throw instance.error.type({
            name: 'util.string',
            type: 'String',
            data: !target? target : target.constructor.name
        });
        return {
            toTemplate: context => {
                const reTokens = /\$\{([\s]*[^;\s]+[\s]*)\}/g;
                const reRemove = /(\$\{(?!map\.)[^}]+\})/g;
                const str = target
                    // replaces expressions with ${map.expression}
                    .replace(reTokens, (x,y) => `\$\{map.${y.trim()}\}`)
                    // removes every expression that does not begin with "map."
                    .replace(reRemove, '')
                return Function('map', `return \`${str}\``)(context);
            }
        }
    }

    return Rx.Observable.of(util);
};
