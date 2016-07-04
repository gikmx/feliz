'use strict';

const PATH   = require('path');
const EVENTS = require('events');
const Rx     = require('rxjs/Rx');

const Server  = require('./server');
const Modules = require('./modules');
const Options = require('./options');

class Events extends EVENTS {};

module.exports = (options={}) => Rx.Observable.create(observer => {

    const self  = {};
    self.set    = (key, val) => self[key] = val;
    self.events = new Events();

    const core$ = Modules.rxLoad(PATH.join(__dirname, 'core'));
    const base$ = Modules.rxLoad(PATH.join(__dirname, 'base'));
    const opts$ = Options.rxLoad(options)

    const modules$ = Rx.Observable
        .concat(core$, opts$, base$)
        .concatMap(mod => mod.type == 'module'?
            Modules.rxResolve(self, mod) : Options.rxResolve(self, mod)
        )
        .do(target => {
            self[target.name] = target.data;
            self.events.emit(`module:${target.name}`, self);
        })
        .toArray()
        .do(() => self.events.emit('modules', self))

    const self$ = modules$
        .switchMap(()=> Server(self))
        .do(() => self.events.emit('server', self));

    const onCancel = () => self.server.stop(err => {
        if (err) return observer.error(err);
        observer.complete();
    });

    self$.subscribe(
        () => {
            process.on('SIGINT', onCancel);
            observer.next(self);
        },
        err => observer.error(err)
    )
});

module.exports.Rx = Rx;
