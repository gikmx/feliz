'use strict';

const Rx       = require('rxjs/Rx');
const Hapi     = require('hapi');
const Socket   = require('socket.io');
const SocketWc = require('socketio-wildcard');

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

    instance.server.start(err => {
        if (err) return observer.error(err);
        observer.next(instance);

        process.on('SIGINT', function(){
            instance.server.stop(err => {
                if (err) return observer.error(err);
                observer.complete();
                process.exit(0);
            });
        })
    })
});

