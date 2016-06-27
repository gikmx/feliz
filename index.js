'use strict';

const FS   = require('fs');
const PATH = require('path');

const Rx = require('rxjs/Rx');

const Setup = require('./setup');
const Config = require('./config.json');

// Folders where the modules reside
const PATH_CORE = PATH.join(__dirname, 'core');
const PATH_BASE = PATH.join(__dirname, 'base');

// Convert Node functions into observable generators
const rxReaddir = Rx.Observable.bindNodeCallback(FS.readdir);
const rxAccess  = Rx.Observable.bindNodeCallback(FS.access);

// Module loader
const rxModules = path =>
    rxAccess(path, FS.R_OK)
    .mergeMap(()=> rxReaddir(path))
    .mergeMap(filenames => filenames.sort())
    .map(filename => ({
        name: PATH
            .basename(filename, PATH.extname(filename))
            .replace(/^\d+\-/,''),
        data: require(PATH.join(path, filename))
    }));

module.exports = (options={}) => Rx.Observable.create(observer => {

    // temporary object that will store the main instance while being created
    // TODO: Find a way to get rid of this, instace$ should store this temp data.
    let fai = {};

    const options$ = Rx.Observable.of({ name: 'options', data: options });
    const core_modules$ = rxModules(PATH_CORE);
    const base_modules$ = rxModules(PATH_BASE);

    const instance$ = Rx.Observable
        .concat(core_modules$, options$, base_modules$)
        // Make sure every item is resolved in order before proceeding.
        .concatMap(item => {
            if (typeof item.data !== 'function') return Rx.Observable.of(item);
            return Rx.Observable.create(obs => {
                item.data(fai, item.name).subscribe(
                    data => obs.next({ data, name:item.name }),
                    err  => obs.error(err),
                    ()   => obs.complete()
                );
            });
        })
        // validate options before continuing to parse everything else
        // core modules will be available at this point
        .concatMap(item => {
            // Populate tmp instance and continue if not dealing with options.
            fai[item.name] = item.data;
            if (item.name !== 'options') return Rx.Observable.of(item);
            // synchronouse validations
            if (!fai.util.is(item.data).object()) throw fai.error.type({
                name: 'options',
                type: 'Object',
                data: !item.data? item.data : item.data.constructor.name
            });
            if (!fai.util.is(item.data.root).string()) throw fai.error.type({
                name: 'options.root',
                type: 'String',
                data: !item.data.root?
                    item.data.root : item.dara.root.construcor.name
            });
            if (item.data.root[0] !== PATH.sep)
                item.data.root = PATH.resolve(item.data.root);
            // make sure plugins is always populated
            if (!fai.util.is(item.data.plugins).array()) item.data.plugins = [];
            // async validations
            const root_opt$ = Rx.Observable
                .of(item.data.root)
                .concatMap(root => rxAccess(root, FS.R_OK))
                .catch(()=> {
                    throw fai.error.type({
                        name: 'options.root',
                        type: 'existent path',
                        data: !item.data.root?
                            item.data.root : item.data.root.construcor.name
                    });
                });
            const plugins_opt$ = Rx.Observable
                .of(item.data.plugins)
                .mergeAll()
                .map(plugin => {
                    if (!fai.util.is(plugin.options).object()) plugin.options = {};
                    if (!fai.util.is(plugin.connection).object()) plugin.connection = {};
                    if (!fai.util.is(plugin.register).function()) throw fai.error.type({
                        name: 'plugin.register',
                        type: 'Function',
                        data: !plugin.register?
                            plugin.register : plugin.register.constructor.name
                    })
                    return plugin;
                })
                .toArray()
                .do(plugins => item.data.plugins = plugins);
            // merge all async operators, but always return the (modified) item
            return Rx.Observable
                .concat(root_opt$, plugins_opt$)
                .mapTo(item);
        })
        .reduce((instance, item) => {
            instance[item.name] = item.data;
            return instance;
        }, {})
        // we no longer need the temporary instance, get rid of it.
        .do(() => { fai = undefined });

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

