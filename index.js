'use strict';

const Rx = require('rxjs/Rx');

module.exports = (options={}) => Rx.Observable.create(observer => {

    observer.next(null);
    observer.complete();

    return function(){
        process.stdout.write('»\n');
    }
});
