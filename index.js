'use strict';

const PATH = require('path');
const Rx   = require('rxjs/Rx');

const Server  = require('./server');
const Modules = require('./modules');
const Options = require('./options');

module.exports = (options={}) => Rx.Observable.create(observer => {

    // temporary object that will store the main instance while being created
    // TODO: Find a way to get rid of this, instace$ should store this temp data.
    let fai = {};

    const options$      = Options.rxLoad(options);
    const core_modules$ = Modules.rxLoad(PATH.join(__dirname, 'core'));
    const base_modules$ = Modules.rxLoad(PATH.join(__dirname, 'base'));

    const instance$ = Rx.Observable
        .concat(core_modules$, options$, base_modules$)
        // Make sure every module is resolved in order before proceeding.
        .concatMap(item => {
            if (typeof item.data !== 'function') return Rx.Observable.of(item);
            return Modules.rxResolve(fai, item);
        })
        .concatMap(item => {
            fai[item.name] = item.data;
            if (item.name !== 'options') return Rx.Observable.of(item);
            return Options.rxResolve(fai, item)
        })
        .reduce((instance, item) => {
            instance[item.name] = item.data;
            return instance;
        }, {})
        // we no longer need the temporary instance, get rid of it.
        .do(() => { fai = undefined })
        // instantiate the server (start the server)
        .mergeMap(instance => {
            const server$ = Server(instance);
            if (!server$) return Rx.Observable.of(instance);
            // TODO: Validate that server$ is actually an Observable
            return server$;
        });

    instance$.subscribe(
        instance => observer.next(instance),
        error    => observer.error(error),
        ()       => observer.complete()
    );
});

