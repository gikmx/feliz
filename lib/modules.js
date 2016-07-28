'use strict';

const FS        = require('fs');
const PATH      = require('path');
const Rx        = require('rxjs/Rx');
const FelizUtil = require('feliz.util');

const util = FelizUtil();

// TODO: Make this recursive.
module.exports = {

    rxLoad: path => Rx.Observable
        .of(path)
        .mergeMap(path => util.rx.path(path).readdir())
        .toArray()
        // Iterate directory contents sorted by name (can be numbered)
        .mergeMap(filenames => filenames.sort())
        // remove digits from filename and require the file
        .map(filename => ({
            type:'module',
            name: PATH
                .basename(filename, PATH.extname(filename))
                .replace(/^\d+\-/,''),
            data: require(filename)
        })),

    rxResolve: function(item){ return Rx.Observable.create(observer => {
        const data$ = item.data.call(this, item.name);
        data$.subscribe(
            data => observer.next({ data, name:item.name, type:item.type}),
            err  => observer.error(err),
            ()   => observer.complete()
        );
    })}

}
