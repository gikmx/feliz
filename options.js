'use strict';

const FS   = require('fs');
const PATH = require('path');
const Rx   = require('rxjs/Rx');


const rxRoot = (instance, root) => Rx.Observable.of(root)

module.exports = {

    rxLoad: options => Rx.Observable.of({ name: 'options', data: options }),

    // core modules will be available at this point
    rxResolve: (instance, options) => Rx.Observable.create(observer => {
        const name = options.name;
        options = options.data;
        // options object should always be an object
        if (!instance.util.is(options).object())
            return observer.error(instance.error.type({
                name: 'options',
                type: 'Object',
                data: !options? options : options.constructor.name
            }));
        // verify required properties
        if (!instance.util.is(options.root).string())
            return observer.error(instance.error.type({
                name: 'options.root',
                type: 'String',
                data: !options.root? options.root : options.root.constructor.name
            }));
        // initialize optional properties
        if (!instance.util.is(options.plugins).array()) options.plugins = [];
        if (!instance.util.is(options.config).object()) options.config  = {};
        if (!instance.util.is(options.connection).object()) options.connection  = {};
        // parse properties
        const root$    = instance.util.rx.path(options.root).isDir;
        const plugins$ = Rx.Observable
            .from(options.plugins)
            .map(plugin => {
                if (!instance.util.is(plugin.config).object()) plugin.config = {};
                if (!instance.util.is(plugin.connection).object()) plugin.connection = {};
                if (!instance.util.is(plugin.register).function())
                    return observer.error(instance.error.type({
                        name: 'plugin.register',
                        type: 'Function',
                        data: !plugin.register?
                            plugin.register : plugin.register.constructor.name
                    }))
                return plugin;
            })
            .toArray();
        // the resulting options
        const options$ = Rx.Observable
            .combineLatest(root$, plugins$, (root, plugins)=> {
                options.root    = root;
                options.plugins = plugins;
                return options;
            });

        options$.subscribe(
            options => observer.next({name, data:options}),
            err     => observer.error(err),
            ()      => observer.complete()
        );
    })
}
