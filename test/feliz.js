'use strict';

const Tape         = require('tape');
const {Observable} = require('rxjs/Rx')
const FelizError   = require('feliz.error');
const FelizUtil    = require('feliz.util');

const Package = require('../package.json');
const Feliz   = require('../lib/feliz');
const tests = require('./cases');

Tape('The feliz constructor', t => {
    tests.forEach(test => {
        const feliz = () => new Feliz(test.conf);
        t.doesNotThrow(feliz, null, `should not throw when ${test.desc}`);
        const feliz$ = feliz();
        const msg1 = `should return a RxJS observable when ${test.desc}`;
        const name  = feliz$.constructor.name;
        const isObs = (name == 'Observable' || name == 'ScalarObservable');
        t.equal(isObs, true, msg1);
    });
    t.end();
});

Tape('The returned feliz observable', t => {
    const onInstance = test => {
        const t1 = test.out instanceof Error;
        const t2 = test.out.constructor.name === 'Feliz';
        const m1 = `should ${test.pass? 'not':''} stream error when ${test.desc}`;
        const m2 = `should ${test.pass? '':'not'} resolve to instance when ${test.desc}`;
        if (test.pass){
            // should not stream errors and return a feliz instance
            t.equal(t1, false, m1);
            t.equal(t2, true, m2);
            // unexpected error
            if (t1 !== false) console.log(FelizUtil.examine(test.out));
        } else {
            // should stream and error and not return a feliz instance
            t.equal(t1, true, m1);
            t.equal(t2, false, m2);
        }
        if (test.cbak) test.cbak(t, test);
    };
    const onError = error => {
        t.fail('should never show this message while testing');
        console.log(error);
    };
    const onEnd = () => t.end();
    const tests$ = tests
        .stream()
        .concatMap(test => (new Feliz(test.conf))
            .map(feliz => Object.assign({out:feliz}, test))
            .catch(error => Observable.of(Object.assign({out: error}, test)))
        )
        .subscribe(onInstance, onError, onEnd);
});

Tape('The feliz.observable static member', t => {
    t.equal(typeof Feliz.observable, 'function', 'should be a function');
    const fn1 = Feliz.observable.toString();
    const fn2 = Observable.toString();
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
