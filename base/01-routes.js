'use strict';

const PATH = require('path');
const FS   = require('fs');

const Rx = require('rxjs/Rx');

const rxAccess  = Rx.Observable.bindNodeCallback(FS.access);
const rxReaddir = Rx.Observable.bindNodeCallback(FS.readdir);
const rxStat    = Rx.Observable.bindNodeCallback(FS.stat);
const rxReadAll = function(parent, root=false){
    if (!root) root = parent;
    const items$ = rxReaddir(parent)
        .mergeAll()
        .mergeMap(filename => Rx.Observable.create(observer => {
            const path = PATH.join(parent, filename);
            // determine the possible bundle name
            let name = `${parent.replace(root, '')}${path.replace(parent, '')}`
                .slice(1)
                .slice(0, -1 * PATH.extname(path).length)
            if (name.indexOf('/index') === name.length -6) name = name.slice(0, -6);
            // Determine the type of node.
            rxStat(path).subscribe(
                stats => observer.next({ path, name, isdir: stats.isDirectory() }),
                err   => observer.error(err),
                ()    => observer.complete()
            );
        }));
    const files$ = items$
        .filter(item => !item.isdir && PATH.extname(item.path) === this.path.ext);
    const dir$   = items$
        .filter(item => item.isdir)
        .mergeMap(item => rxReadAll.call(this, item.path, root));
    return Rx.Observable
        .merge(files$, dir$)
        .map(item => ({ path:item.path, name:item.name }))
};

module.exports = function(){

    const PATH_ROUTES = PATH.join(this.path.app.root, 'routes' + this.path.ext);

    // determine which bundles are available (but don't load them)
    const bundles$ = rxReadAll.call(this, this.path.app.bundles).toArray();

    const route$ = rxAccess(PATH_ROUTES, FS.R_OK)
        .catch(() => { throw this.error('Missing Routes file'); })
        .mapTo(require(PATH_ROUTES))
        .mergeMap(routes => Object
            .keys(routes)
            .map(path => Object.assign({path}, routes[path]))
        )

    return bundles$
        .switchMap(bundles => route$
            .map(route => {
                const bundle = bundles
                    .map(item => item.name)
                    .indexOf(route.bundle);
                if (bundle === -1) throw this.error(`Invalid Bundle: ${route.bundle}`);
                route.bundle = bundles[bundle];
                route.bundle.func = require(route.bundle.path);
                return route;
            })
        )
        .toArray()
}
