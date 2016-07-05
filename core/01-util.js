'use strict';

const PATH = require('path');
const FS   = require('fs');

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

    util.rx = {};
    util.rx.node = {
        access : Rx.Observable.bindNodeCallback(FS.access),
        stat   : Rx.Observable.bindNodeCallback(FS.stat),
        read   : Rx.Observable.bindNodeCallback(FS.readFile)
    }

    util.rx.path = target => {
        if (!util.is(target).string()) throw instance.error.type({
            name: 'util.rx.path',
            type: 'String',
            data: !target? target : target.constructor.name
        });
        target = PATH.isAbsolute(target)? target : PATH.resolve(target);

        const path = {};

        path.isReadable = ()=> util.rx.node.access(target, FS.R_OK)
            .catch(err => Rx.Observable.of(null))
            .map(Boolean);

        path.stat = ()=> path
            .isReadable()
            .switchMap(read => read? util.rx.node.stat(target) : Rx.Observable.of(null))

        path.isDir  = ()=> path.stat().map(stat => stat && stat.isDirectory());
        path.isFile = ()=> path.stat().map(stat => stat && stat.isFile());

        path.read = () => path.isFile()
            .mergeMap(isfile => {
                if (!isfile) throw instance.error.type({
                    name: 'util.rx.path.read',
                    type: 'readable file',
                    data: 'unreadable file'
                });
                return util.rx.node.read(target)
            })

        return path;
    };


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
