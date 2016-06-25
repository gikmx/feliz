'use strict';

module.exports = function(){
    return {

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

        object: {
            merge: require('lodash.merge')
        }
    }
}
