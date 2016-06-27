'use strict';

const Rx = require('rxjs/Rx');

module.exports = instance => Rx.Observable.of({
    // Validate primitive values
    is: target => ({
        object    : ()=> target && target.constructor === Object,
        string    : ()=> target && target.constructor === String,
        array     : ()=> target && target.constructor === Array,
        number    : ()=> target && target.constructor === Number,
        date      : ()=> target && target.constructor === Date,
        regex     : ()=> target && target.constructor === RegExp,
        function  : ()=> target && target.constructor === Function,
        null      : ()=> target === null,
        undefined : ()=> target === undefined
    }),
    // Recursively merge 'plain objects'
    object: {
        merge: require('lodash.merge')
    },

    string: {
        toTemplate: function(str){
            str = String(str)
                // replaces expressions with ${map.expression}
                .replace(/\$\{([\s]*[^;\s]+[\s]*)\}/g, (x,y) => `\$\{map.${y.trim()}\}`)
                // removes every expression that does not begin with "map."
                .replace(/(\$\{(?!map\.)[^}]+\})/g, '')
            return Function('map', `return \`${str}\``);
        }
    }
})
