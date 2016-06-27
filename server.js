'use strict';

const Rx       = require('rxjs/Rx');
const Hapi     = require('hapi');
const Socket   = require('socket.io');
const SocketWc = require('socketio-wildcard');

const METHODS = [
    { type: 'http'   , name:'GET'      },
    { type: 'http'   , name:'POST'     },
    { type: 'http'   , name:'PUT'      },
    { type: 'http'   , name:'DELETE'   },
    { type: 'http'   , name:'HEAD'     },
    { type: 'socket' , name:'SOCKET'   }
];

module.exports = instance => Rx.Observable.create(observer => {

    // get configurations and connections from plugins
    const plugins = instance.options.plugins
        .map(plugin => {
            instance.options.config = instance.util
                .object(instance.options.config)
                .merge(plugin.config);
            instance.options.connection = instance.util
                .object(instance.options.connection)
                .merge(plugin.connection);
            return plugin.register;
        });

    // Set configuration and connection defaults
    instance.options.config = instance.util
        .object({
            connections: {
                routes: {
                    files: { relativeTo: instance.options.root }
                }
            }
        })
        .merge(instance.options.config);
    instance.options.connection = instance.util
        .object({
            port: process.env.PORT || 8000
        })
        .merge(instance.options.connection);


    instance.server = new Hapi.Server(instance.options.config);
    instance.server.connection(instance.options.connection);

    plugins.map(plugin => instance.server.register(plugin))

    // Enable socket.io integration (in the same port)
    instance.socket = Socket(instance.server.listener);
    instance.socket.use(SocketWc());
    instance.socket.on('connection',function(){
        instance.socket.on('*', function(event){
            let data  = e.data[1];
            let types = e.data[0].split(':');
            let type  = {
                subject   : types.shift(),
                predicate : types.join(':')
            }
            const route = instance.routes.socket
                .filter(route => route.path === type.subject)
                .shift();
            if (route) route.bundle.func.call(instance, type.predicate, data);
        });
    })

    // Enable routes
    const routes$ = Rx.Observable
        .from(instance.routes)
        // generate a route for each method sent
        .mergeMap(route => {
            // store the bundle separatedly
            const bundle = route.bundle;
            delete route.bundle;
            // methods can be arrays, so, let's always deal with them.
            const target = instance.util.is(route.method);
            if (target.string()) route.method = [route.method];
            else if(!target.array()) throw instance.error.type({
                name: 'route.method',
                type: 'Array',
                data: !route.method? route.method : route.method.constructor.name
            });
            return route.method.map(name => {
                const methods = METHODS.filter(method => method.name === name);
                if (!methods.length) throw instance.error.type({
                    name: 'route.method',
                    type: 'Valid method',
                    data: name
                });
                return Object.assign({}, route, {
                    method   : name,
                    __type   : methods.shift().type,
                    __bundle : bundle
                })
            })
        });

    // Manage http routes
    const http_routes$ = routes$
        .filter(route => route.__type == 'http')
        .map(route => {
            const props = {
                type   : route.__type,
                bundle : route.__bundle
            };
            delete route.__type;
            delete route.__bundle;
            route.handler = function(request, reply){
                request.bundle = props;
                props.bundle.func.call(instance, request, reply);
            }
            instance.server.route(route);
            return route;
        })
        .toArray();

    // Manage socket routes
    const socket_routes$ = routes$
        .filter(route => route.__type == 'socket')
        .map(route => {
            route.type   = route.__type;
            route.bundle = route.__bundle;
            delete route.__type;
            delete route.__bundle;
            return route;
        })
        .toArray()

    const server$ = Rx.Observable
        // register routes
        .combineLatest(http_routes$, socket_routes$, (http, socket) => ({http, socket}))
        // Start server
        .switchMap(routes => Rx.Observable.create(obs => {
            instance.routes = routes;
            instance.server.start(err => {
                if (err) return obs.error(err);
                obs.next(true);
                obs.complete()
            })
        }));

    server$.subscribe(
        () => {
            observer.next(instance);
            process.on('SIGINT', function(){
                instance.server.stop(err => {
                    if (err) return observer.error(err);
                    observer.complete();
                    process.exit(0);
                });
            })
        },
        err => observer.error(err)
    )
});

