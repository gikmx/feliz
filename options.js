'use strict';

const FS   = require('fs');
const PATH = require('path');
const Rx   = require('rxjs/Rx');

const rxPlugins = (instance, plugins) => Rx.Observable
    .from(plugins)
    .mergeMap(plugin => {
        // Validate plugin and properties types
        if (!instance.util.is(plugin).object()) throw instance.error.type({
            name: 'plugin',
            type: 'Object',
            data: !plugin? plugin : plugin.constructor.name
        });
        if (!instance.util.is(plugin.name).string()) throw instance.error.type({
            name: 'plugin.name',
            type: 'String',
            data: !plugin.name? plugin.name : plugin.name.constructor.name
        });
        // Validate and register events (if existent)
        if (instance.util.is(plugin.when).object()) return Rx.Observable
            .of(plugin.when)
            .mergeMap(events => Object
                .keys(events)
                .map(name => ({name, data:events[name]}))
            )
            .map(event => instance.events.on(event.name, event.data.bind(instance)))
            .toArray()
            .do(() => delete plugin.when)
            .mapTo(plugin)
        return Rx.Observable.of(plugin);
    })
    .toArray();

module.exports = {

    rxLoad: options => Rx.Observable.of({
        type: 'data',
        name: 'options',
        data: options
    }),

    // core modules will be available at this point
    rxResolve: (instance, options) => Rx.Observable.create(observer => {

        if (!instance.util) return observer.error(instance.error('Utilities missing.'));

        const name = options.name;
        options = options.data;

        if (!instance.util.is(options).object())
            return observer.error(instance.error.type({
                name: 'options',
                type: 'Object',
                data: !options? options : options.constructor.name
            }));

        // Parse and define the (required) 'root' property
        if (!instance.util.is(options.root).string())
            return observer.error(instance.error.type({
                name: 'options.root',
                type: 'String',
                data: !options.root? options.root : options.root.constructor.name
            }));
        const root$ = instance.util.rx.path(options.root).isDir;

        // Initialize and parse optional properties
        if (!instance.util.is(options.server).object()) options.server  = {};
        if (!instance.util.is(options.connection).object()) options.connection  = {};

        // Initialize and parse plugins
        if (!instance.util.is(options.plugins).array()) options.plugins = [];
        const plugins$ = rxPlugins(instance, options.plugins);

        // the resulting options
        const options$ = Rx.Observable
            .combineLatest(root$, plugins$, (root, plugins)=> {
                options.root    = root;
                options.plugins = plugins;
                return options;
            });

        options$.subscribe(
            options => observer.next({name, data:options, type:'data'}),
            err     => observer.error(err),
            ()      => observer.complete()
        );
    })
}
