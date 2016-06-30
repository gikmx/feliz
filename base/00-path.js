'use strict';

const PATH = require('path');
const FS   = require('fs');

const Rx   = require('rxjs/Rx');

const rxAccess = Rx.Observable.bindNodeCallback(FS.access);
const rxMkDir  = Rx.Observable.bindNodeCallback(FS.mkdir);

const OPTIONS = {
    "ext"         : { "type" : "extname" , "args" : ["${__filename}"] },
    "app.root"    : { "type" : "join"    , "args" : ["${root}"]  },
    "app.bundles" : { "type" : "join"    , "args" : ["${root}", "bundles"] }
};

module.exports = instance => Rx.Observable.create(observer => {

    // Populate paths
    if (instance.util.is(instance.options.path).object())
        instance.options.path = instance.util
            .object(OPTIONS)
            .merge(instance.options.path)
    else instance.options.path = OPTIONS;

    // The variables available for path replacement
    const context = Object.assign({
        __filename,
        __dirname,
        __env: process.env
    }, instance.options);

    const path$ = Rx.Observable
        .of(instance.options.path)
        .mergeMap(paths => Object
            .keys(paths)
            .map(name => Object.assign({name}, paths[name]))
        )
        .map(path => {
            path.args = path.args
                .map(arg => instance.util.string(arg).toTemplate(context));
            return path;
        })
        .reduce((result, item) => {
            const path = PATH[item.type].apply(PATH, item.args);
            return instance.util.object(result).merge(item.name
                .split('.')
                .reduce((acc, cur, i, arr) => {
                    let val = i === arr.length - 1? path : {};
                    if (!Object.keys(acc).length) acc[cur] = val;
                    else {
                        let ref = arr
                            .slice(0, i)
                            .reduce((o,i) => o[i], acc);
                        ref[cur] = val;
                    }
                    return acc;
                }, {})
            );
        }, {});

    path$.subscribe(
        path => observer.next(path),
        err  => observer.error(err),
        ()   => observer.complete()
    );
});
