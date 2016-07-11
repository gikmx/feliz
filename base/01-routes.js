'use strict';

const PATH = require('path');
const FS   = require('fs');
const Rx   = require('rxjs/Rx');

const METHODS = [
    { type: 'http'   , name:'GET'      },
    { type: 'http'   , name:'POST'     },
    { type: 'http'   , name:'PUT'      },
    { type: 'http'   , name:'DELETE'   },
    { type: 'http'   , name:'HEAD'     },
    { type: 'socket' , name:'SOCKET'   }
];

module.exports = function(){

    const PATH_ROUTES = PATH.join(this.path.root, `routes${this.path.ext}`);

    const route$ = this.util.rx.path(PATH_ROUTES)
        .isReadable()
        .map(isreadable => {
            if (!isreadable) throw this.error('Missing routes files');
            return require(PATH_ROUTES);
        })
        // convert keys into properties (path)
        .mergeMap(routes => Object
            .keys(routes)
            .map(path => Object.assign({path}, routes[path]))
        )
        // determine if the bundle actually exists
        .mergeMap(route => {
            route.bundle = route.bundle.replace('/', PATH.sep);
            let path = PATH.join(this.path.bundles, route.bundle);
            return this.util.rx.path(path)
                .isDir()
                .map(isdir => isdir? PATH.join(path, 'index') : path)
                .mergeMap(file => {
                    path = `${file}${this.path.ext}`;
                    return this.util.rx.path(path).isFile();
                })
                .map(isfile => {
                    if (!isfile) throw this.error(`Invalid Bundle: ${route.bundle}`)
                    const name = route.bundle;
                    delete route.bundle;
                    return { name, path, bundle: require(path), conf:route }
                });
        })
        // Validate methods
        .map(route => {
            const type = this.util.is(route.conf.method);
            if (!type.string() && !type.array()) route.conf.method = ['GET'];
            if (type.string()) route.conf.method = [route.conf.method];
            if (!route.conf.method.length) throw instance.error.type({
                name: 'route.method',
                type: 'Array of method(s)',
                data: 'empty array'
            });
            const types = [];
            route.conf.method.forEach(method => {
                const methods = METHODS.filter(m => m.name === method);
                if (!methods.length) throw this.error.type({
                    name: 'route.method',
                    type: `valid method (${METHODS.join(',')})`,
                    data: method
                });
                const type = methods.shift().type;
                if (types.indexOf(type) === -1) types.push(type);
            });
            if (types.length > 1)
                throw this.error(`Methods of route ${route.name} must be the same type`);
            route.type = types[0];
            return route;
        });

    return route$.toArray();
}
