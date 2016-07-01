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

    // The variables available for path replacement
    const getContext = options => instance.util
        .object({
            __filename,
            __dirname,
            root : instance.options.root
        })
        .merge(options);

    // Populate paths
    if (instance.util.is(instance.options.path).object())
        instance.options.path = instance.util
            .object(OPTIONS)
            .merge(instance.options.path)
    else instance.options.path = OPTIONS;

    const path$ = Rx.Observable
        .of(instance.options.path)
        // convert the key to a 'name' property
        .mergeMap(paths => Object
            .keys(paths)
            .map(name => Object.assign({name}, paths[name]))
        )
        .reduce((result, item) => {
            // update the context used for templates
            const context = getContext(result);
            // Resolve (pseudo)template strings sent
            item.args = item.args.map(arg => instance.util
                .string(arg)
                .toTemplate(context)
            )
            // construct the value with the data sent
            const path = PATH[item.type].apply(PATH, item.args);
            // resolve the key name into a proper object
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
        }, {})
        .do(path => {
            console.log(path);
            process.exit(0);
        })

    path$.subscribe(
        path => observer.next(path),
        err  => observer.error(err),
        ()   => observer.complete()
    );
});
