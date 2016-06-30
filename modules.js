'use strict';

const FS   = require('fs');
const PATH = require('path');
const Rx   = require('rxjs/Rx');

const rxReaddir = Rx.Observable.bindNodeCallback(FS.readdir);
const rxIsDir   = path => Rx.Observable.create(observer => {
    FS.stat(path, (error, stats) => {
        if (error) return observer.error(error);
        if (!stats.isDirectory())
            return observer.error(new Error(`Invalid directory: ${item.path}`));
        observer.next(path);
        observer.complete();
    });
});

// TODO: Make this recursive.
module.exports = {

    rxLoad: path => Rx.Observable.of(path)
        .mergeMap(rxIsDir)
        .mergeMap(rxReaddir)
        // Iterate directory contents sorted by name (can be numbered)
        .mergeMap(filenames => filenames.sort())
        // remove digits from filename and require the file
        .map(filename => ({
            type:'module',
            name: PATH
                .basename(filename, PATH.extname(filename))
                .replace(/^\d+\-/,''),
            data: require(PATH.join(path, filename))
        })),

    rxResolve: (instance, item) => Rx.Observable.create(observer => {
        item.data(instance, item.name).subscribe(
            data => observer.next({ data, name:item.name, type:item.type}),
            err  => observer.error(err),
            ()   => observer.complete()
        );
    })
}
