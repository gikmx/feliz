'use strict';

const Tape       = require('tape');
const RxJS       = require('rxjs')
const FelizError = require('feliz.error');
const FelizUtil  = require('feliz.util');

const Package = require('../package.json');
const Feliz   = require('../lib/feliz');

Tape('feliz', t => {

    t.equal(typeof Feliz, 'function', 'should be a function');

    t.end();
})

Tape('feliz.observable', t => {

    t.equal(typeof Feliz.observable, 'function', 'should be a function');

    const fn1 = Feliz.observable.toString();
    const fn2 = RxJS.Observable.toString();
    t.equal(fn1, fn2, 'should be the same function as rxjs');

    t.end();
})

Tape('feliz.error', t => {
    t.deepEqual(Feliz.error, FelizError, 'should be the feliz.error module');
    t.end();
});

Tape('feliz.util', t => {
    t.deepEqual(Feliz.util, FelizUtil, 'should be the feliz.util module');
    t.end();
});

Tape('feliz.package', t => {
    t.deepEqual(Feliz.package, Package, 'should be the same object as package.json');
    t.end();
});
