'use strict';

const Rx       = require('rxjs/Rx');
const Hapi     = require('hapi');
const Socket   = require('socket.io');
const SocketWc = require('socketio-wildcard');


module.exports = function(){

    // Set configuration and connection defaults
    this.options.connection = this.util
        .object({ port: process.env.PORT || 8000 })
        .merge(this.options.connection);

    this.server = new Hapi.Server(this.options.server);
    this.server.connection(this.options.connection);

    // Enable socket.io integration (in the same port)
    this.socket = Socket(this.server.listener);
    this.socket.use(SocketWc());
    this.socket.on('connection',function(){
        this.events.emit('socket', this);
        this.socket.on('*', function(event){
            let data  = e.data[1];
            let types = e.data[0].split(':');
            let type  = {
                subject   : types.shift(),
                predicate : types.join(':')
            }
            const route = this.routes.socket
                .filter(route => route.path === type.subject)
                .shift();
            if (route) route.bundle.func.call(this, type.predicate, data);
        });
    })

    // Register plugins
    const all_plugins$   = Rx.Observable.from(this.options.plugins);
    const other_plugins$ = all_plugins$.filter(plugin => !plugin.data)
    const data_plugins$  = all_plugins$
        .filter(plugin => plugin.data)
        .mergeMap(plugin => Rx.Observable.create(obs => {
            this.server.register(plugin.data, err => {
                if (err) return obs.error(err);
                this.events.emit(`plugin:${plugin.name}`, this);
                obs.next(plugin);
                obs.complete();
            });
        }));

    const plugins$ = Rx.Observable
        .merge(data_plugins$, other_plugins$)
        .toArray()
        .do(plugins => this.events.emit('plugins', this, plugins))

    // Manage http routes
    const http_routes$ = Rx.Observable
        .from(this.routes)
        .filter(route => route.type == 'http')
        .map(route => {
            route.conf.handler = (function(request, reply){
                this.route = route;
                route.bundle.call(this, request, reply);
            }).bind(this);
            this.server.route(route.conf)
            this.events.emit(`route:${route.name}`, this);
            return route;
        })
        .toArray()
        .do(() => this.events.emit('routes:http', this));

    // Manage socket routes
    const socket_routes$ = Rx.Observable
        .from(this.routes)
        .filter(route => route.type == 'socket')
        .toArray()
        .do(() => this.events.emit('routes:socket', this));

    return Rx.Observable
        // register routes
        .combineLatest(
            plugins$,
            http_routes$,
            socket_routes$,
            (plugins, http, socket) => ({http, socket})
        )
        .do(() => this.events.emit('routes', this))
        // Start server
        .switchMap(routes => Rx.Observable.create(obs => {
            this.server.start(err => {
                if (err) return obs.error(err);
                obs.next(true);
                obs.complete()
            })
        }));

};

