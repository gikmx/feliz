'use strict';

const FS   = require('fs');
const PATH = require('path');
const Rx   = require('rxjs/Rx');

const rxPlugins = function(plugins){ return Rx.Observable
    .from(plugins)
    .mergeMap(plugin => {
        // Validate plugin and properties types
        if (!this.util.is(plugin).object()) throw this.error.type({
            name: 'plugin',
            type: 'Object',
            data: !plugin? plugin : plugin.constructor.name
        });
        if (!this.util.is(plugin.name).string()) throw this.error.type({
            name: 'plugin.name',
            type: 'String',
            data: !plugin.name? plugin.name : plugin.name.constructor.name
        });
        // Validate and register events (if existent)
        if (this.util.is(plugin.when).object()) return Rx.Observable
            .of(plugin.when)
            .mergeMap(events => Object
                .keys(events)
                .map(name => ({name, data:events[name]}))
            )
            .map(event => this.events.on(event.name, function(self){
                event.data.call(self, self);
            }))
            .toArray()
            .do(() => delete plugin.when)
            .mapTo(plugin)
        return Rx.Observable.of(plugin);
    })
    .toArray();
}

module.exports = {

    rxLoad: options => Rx.Observable.of({
        type: 'data',
        name: 'options',
        data: options
    }),

    // core modules will be available at this point
    rxResolve: function(options){ return Rx.Observable.create(observer => {

        if (!this.util) return observer.error(this.error('Utilities missing.'));

        const name = options.name;
        options = options.data;

        if (!this.util.is(options).object()) return observer.error(this.error.type({
            name: 'options',
            type: 'Object',
            data: !options? options : options.constructor.name
        }));

        // Parse and define the (required) 'root' property
        if (!this.util.is(options.root).string()) return observer.error(this.error.type({
            name: 'options.root',
            type: 'String',
            data: !options.root? options.root : options.root.constructor.name
        }));

        const root$ = this.util.rx.path(options.root)
            .isDir()
            .map(isdir => {
                if (!isdir) throw this.error('Invalid root directory');
                return options.root;
            });

        // Initilize events sent at startup
        if (!this.util.is(options.events).object()) options.events = {};
        const events$ = Rx.Observable
            .of(options.events)
            .mergeMap(events => Object
                .keys(events)
                .map(name => ({name, func:events[name]}))
            )
            .do(event => this.events.on(event.name, event.func.bind(this)))
            .toArray()
            .mapTo(null);

        // Initialize and parse optional properties
        if (!this.util.is(options.server).object()) options.server  = {};
        if (!this.util.is(options.connection).object()) options.connection  = {};

        // Initialize and parse plugins
        if (!this.util.is(options.plugins).array()) options.plugins = [];
        const plugins$ = rxPlugins.call(this, options.plugins);

        // the resulting options
        const options$ = Rx.Observable
            .combineLatest(events$, root$, plugins$, (events, root, plugins)=> {
                options.root    = root;
                options.plugins = plugins;
                return options;
            });

        options$.subscribe(
            options => observer.next({name, data:options, type:'data'}),
            err     => observer.error(err),
            ()      => observer.complete()
        );
    })}
}
