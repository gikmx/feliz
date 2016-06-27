'use strict';

const FS   = require('fs');
const PATH = require('path');

const Rx = require('rxjs/Rx');

const Setup = require('./setup');
const Config = require('./config.json');

// The folder where the core modules reside
const PATH_MODULES = PATH.join(__dirname, 'modules');

// Convert Node functions into observable generators
const rxReaddir = Rx.Observable.bindNodeCallback(FS.readdir);
const rxAccess  = Rx.Observable.bindNodeCallback(FS.access);

module.exports = (options={}) => Rx.Observable.create(observer => {

    // temporary object that will store the main instance while being created
    // TODO: Find a way to get rid of this, instace$ should store this temp data.
    let tmp = {};

    const options$ = Rx.Observable.of({ name: 'options', data: options });

    const modules$ = rxAccess(PATH_MODULES, FS.R_OK)
        .mergeMap(()=> rxReaddir(PATH_MODULES))
        .mergeMap(filenames => filenames.sort())
        .map(filename => ({
            name: PATH
                .basename(filename, PATH.extname(filename))
                .replace(/^\d+\-/,''),
            data: require(PATH.join(PATH_MODULES, filename))
        }));

    const instance$ = Rx.Observable
        .merge(modules$, options$)
        .mergeMap(item => {
            if (typeof item.data !== 'function') return Rx.Observable.of(item);
            else return Rx.Observable.create(obs => {
                // instantiate each item and send the current value of the main instance
                item.data(tmp, item.name).subscribe(
                    data => {
                        tmp[item.name] = data;
                        obs.next({ data, name:item.name });
                    },
                    err => obs.error(err),
                    ()  => obs.complete()
                );
            });
        })
        .reduce((instance, item) => {
            instance[item.name] = item.data;
            return instance;
        }, {})
        // we no longer need the temporary instance, get rid of it.
        .do(() => { tmp = undefined });

    function onReady(type, instance){
        // Handle errors or completions
        if (type != 'ready') return this[type](instance);
        const result = Setup(instance);
        if (result) instance = result;;
        this.next(instance);
    }

    instance$.subscribe(
        onReady.bind(observer, 'ready'),
        onReady.bind(observer, 'error'),
        onReady.bind(observer, 'complete')
    );
});

