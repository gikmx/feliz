'use strict';

const PATH   = require('path');
const EVENTS = require('events');
const Rx     = require('rxjs/Rx');
const FError = require('feliz.error');
const FUtil  = require('feliz.util');

const Package = require('../package.json');
const Server  = require('./server');
const Modules = require('./modules');
const Options = require('./conf');

class Events extends EVENTS {};

const error = FError();
const util  = FUtil();

/**
 * Hola mundo
 *
 * @param {object} conf The only required property is: root
 * @return {Observable} The instance ready for suscription.
 **/
module.exports = (conf={}) => Rx.Observable.create(observer => {

    const self  = { info: Package };
    self.set    = (key, val) => self[key] = val;
    self.events = new Events();

    const core$ = Modules.rxLoad(PATH.join(__dirname, 'core'));
    const base$ = Modules.rxLoad(PATH.join(__dirname, 'base'));
    const conf$ = Options.rxLoad(conf)

    const modules$ = Rx.Observable
        .concat(core$, conf$, base$)
        .concatMap(mod => {
            if (mod.type == 'module') return Modules.rxResolve.call(self, mod);
            if (mod.type == 'data') return Options.rxResolve.call(self, mod);
            throw error.type({
                name: 'module',
                type: 'module || data',
                data: mod.type
            });
        })
        .do(target => {
            self[target.name] = target.data;
            self.events.emit(`module:${target.name}`, self);
        })
        .toArray()
        .do(() => self.events.emit('modules', self))

    const self$ = modules$
        .switchMap(()=> Server.call(self))
        .do(() => self.events.emit('server', self));

    process.on('SIGINT', function(){
        self.server.stop(err => {
            if (err) observer.error(err);
            else observer.complete();
            process.exit(0);
        })
    });

    self$.subscribe(
        ()  => observer.next(self),
        err => observer.error(err)
    )
});

module.exports.Rx = Rx;
module.exports.Error = error;
module.exports.Util  = util;
