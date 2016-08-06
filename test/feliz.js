'use strict';

const PATH   = require('path');
const EVENTS = require('events');

const Tape       = require('tape');
const RxJS       = require('rxjs')
const FelizError = require('feliz.error');
const FelizUtil  = require('feliz.util');

const Package = require('../package.json');
const Feliz   = require('../lib/feliz');

class Path extends String {
    get(){ return String(this); }
};

const Events = new (class extends EVENTS {});
const TestFS = new Path(PATH.resolve(PATH.join(__dirname, '..', 'test-fs')));

TestFS.empty        = PATH.join(TestFS.get(), 'empty');
TestFS.emptyRoutes  = PATH.join(TestFS.get(), 'emptyRoutes');
TestFS.invalidRoute = PATH.join(TestFS.get(), 'invalidRoute');
TestFS.validRoute   = PATH.join(TestFS.get(), 'validRoute');

const streams = [
    { conf:null                       , type:'no params'                 , valid:0 },
    { conf:{root:null}                , type:'falsy root'                , valid:0 },
    { conf:{root:'./123'}             , type:'invalid root'              , valid:0 },
    { conf:{root:TestFS.empty}        , type:'valid root; empty dir.'    , valid:1 },
    // { conf:{root:TestFS.emptyRoutes}  , type:'valid root; empty routes'  , valid:1 },
    // { conf:{root:TestFS.invalidRoute} , type:'valid root; invalid route' , valid:0 },
    // { conf:{root:TestFS.validRoute}   , type:'valid root; valid route'   , valid:1 },
];

Tape('The feliz constructor', t => {
    streams.forEach(stream => {
        const feliz = () => new Feliz(stream.conf);
        t.doesNotThrow(feliz, null, `should not throw when ${stream.type}`);
        const feliz$ = feliz();
        const msg1 = `should return a RxJS observable when ${stream.type}`;
        const name  = feliz$.constructor.name;
        const isObs = (name == 'Observable' || name == 'ScalarObservable');
        t.equal(isObs, true, msg1);
    });
    t.end();
});

Tape('The returned feliz observable', t => {

    let remaining = streams.length;
    Events.on('1:done', ()=> !(--remaining) && t.end());

    streams.forEach(stream => {
        const feliz$ = new Feliz(stream.conf);
        if (stream.valid) feliz$.subscribe(
            feliz => {
                const msg2 = `should resolve to a feliz instance when ${stream.type}`;
                t.equal(feliz.constructor.name, 'feliz', msg2);
                Events.emit('1:done');
            },
            error => {
                t.fail(`should not stream errors when ${stream.type}`),
                Events.emit('1:done');
            }
        );
        else feliz$.subscribe(
            feliz => {
                t.fail(`should stream an error when ${stream.type}`);
                Events.emit('1:done');
            },
            error => {
                const msg = `should stream an error when ${stream.type}`;
                t.equal(error instanceof Error, true, msg);
                Events.emit('1:done');
            }
        )
    });
});

Tape('The feliz.observable static member', t => {
    t.equal(typeof Feliz.observable, 'function', 'should be a function');
    const fn1 = Feliz.observable.toString();
    const fn2 = RxJS.Observable.toString();
    t.equal(fn1, fn2, 'should be the same function as rxjs');
    t.end();
});

Tape('The feliz.error static member', t => {
    t.deepEqual(Feliz.error, FelizError, 'should be the feliz.error module');
    t.equal(!!Feliz.error, true, 'should be a non falsy value');
    t.equal(Feliz.error.constructor.name, 'Function', 'should be a function');
    t.end();
});

Tape('The feliz.util static member', t => {
    t.deepEqual(Feliz.util, FelizUtil, 'should be the feliz.util module');
    t.equal(!!Feliz.util, true, 'should be a non falsy value');
    t.equal(Feliz.util.constructor.name, 'Object', 'should be an object');
    t.end();
});

Tape('The feliz.package static member', t => {
    t.deepEqual(Feliz.package, Package, 'should be the same object as package.json');
    t.equal(!!Feliz.package, true, 'should be a non falsy value');
    t.equal(Feliz.package.constructor.name, 'Object', 'should be an object');
    t.end();
});
