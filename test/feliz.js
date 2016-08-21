'use strict';

const PATH = require('path');

const Test         = require('feliz.test');
const FelizError   = require('feliz.error');
const FelizUtil    = require('feliz.util');
const {Observable} = require('rxjs/Rx');

const Feliz   = require('../lib/feliz');
const Package = require('../package.json');

const path = { root: PATH.join(__dirname, 'app') };
path.empty = PATH.join(path.root, 'empty');

const expected = {
    path: {
        sep  : PATH.sep,
        ext  : PATH.extname(__filename),
        root : path.empty
    }
};

const tests = [
    {
        desc: 'no conf sent',
        conf: null,
        pass: false
    },
    {
        desc: 'falsy value on conf.root',
        conf: {root:null},
        pass: false
    },
    {
        desc: 'inexistent relative dir on conf.root',
        conf: {root:'./zxcvlzck'},
        pass: false
    },
    {
        desc: 'inexistent absolute dir on conf.root',
        conf: {root:'/hjshs/zxcvlzck'},
        pass: false
    },
    {
        desc: 'empty existent dir on conf.root',
        conf: { root:path.empty },
        pass: true
    },
    {
        desc: 'valid conf.root with non-object conf.path',
        conf: { root:path.empty, path: null },
        pass: false
    },
    {
        desc: 'valid conf.root with empty object with conf.path',
        conf: { root:path.empty, path: {} },
        pass: true,
        call: function(tape, response) {
            if (response instanceof Error) return;
            const msg = `should have path umodified when ${this.desc}`;
            tape.deepEqual(response.path, expected.path, msg);
            tape.end();
        }
    },
    {
        desc: 'valid conf.root with non-object path definition',
        conf: { root:path.empty, path:{test:null} },
        pass: false
    },
    {
        desc: 'valid conf.root with empty path definition',
        conf: { root:path.empty, path:{test:{}} },
        pass: false
    },
    {
        desc: 'valid conf.root with invalid path defintiion',
        conf: { root:path.empty, path: {test:{ type:'iDontExist', args:[1,2] }} },
        pass: false,
    },
    {
        desc: 'valid conf.root with custom conf.path',
        conf: {
            root: path.empty,
            path: { test: { type:'join', args:['${root}', 'test'] } }
        },
        pass: true,
        call: (tape, response)=> {
            if (response instanceof Error) return;
            const msg = `should have correctly created path when ${this.desc}`;
            const pth = { test: PATH.join(path.empty, 'test') };
            tape.deepEqual(response.path, Object.assign(pth, expected.path), msg);
            tape.end();
        }
    },
    {
        desc: 'valid conf.root with complex conf.path',
        conf: {
            root: path.empty,
            path: {
                'root.hello'   : { type : 'join', args : ['1']     } ,
                'root.one.two' : { type : 'join', args : ['1','2'] } ,
                'root.one.one' : { type : 'join', args : ['1','1'] } ,
                'bundles.test' : { type : 'join', args : ['hola']  } ,
                'hola.test'    : { type : 'join', args : ['/hola'] } ,
            }
        },
        pass:true,
        call: function(tape, response) {
            const pth = Object.assign({}, expected.path);
            const msg = `should have correctly created path when ${this.desc}`;
            pth.root = {hello:'1', one:{two:'1/2', one:'1/1'}};
            pth.bundles = {test:'hola'};
            pth.hola = {test:'/hola'};
            tape.deepEqual(pth, response.path, msg);
            // make an update to the path an check if variable can be used
            const msg1 = `should have update the reference after each setter when ${this.desc}`;
            response.path = {nested:{type:'join', args:['${hola.test}', '2']}}
            pth.nested = [pth.hola.test,'2'].join(PATH.sep);
            tape.deepEqual(response.path, pth, msg1);
            tape.end();
        }
    },
    {
        desc: 'valid conf.root with simple plugin',
        conf: {
            root: path.empty,
            plugins:[
                function test(info){ return this.observable.of(this); }
            ],
            events: [
                {
                    name: 'core:events', // fires as soon as the events can fire.
                    call: function(e){ this.__test = [e.name]; }
                },
                {
                    name:'plugins:test',
                    call: function(e){ this.__test.push(e.name); }
                },
                {
                    name:'plugins:test~before',
                    call: function(e){ this.__test.push(e.name); }
                }
            ]
        },
        pass: true,
        call: function(tape, feliz) {
            if (feliz instanceof Error) return;
            const actual = feliz.events.filter((e,i,a) => a.indexOf(e) === i).sort();
            const expect = feliz.__test.concat('core:conf.setter').sort();
            tape.deepEqual(expect, actual, `should register all events when ${this.desc}`);
            tape.end();
        }
    }
];

const cases = [
    {
        desc: 'The feliz constructor',
        test: tape => tests.forEach((test, i) => {
            const feliz = () => new Feliz(test.conf);
            tape.doesNotThrow(feliz, null, `should not throw when ${test.desc}`);
            const feliz$ = feliz();
            const msg1 = `should return a RxJS observable when ${test.desc}`;
            const name  = feliz$.constructor.name;
            const isObs = (name == 'Observable' || name == 'ScalarObservable');
            tape.equal(isObs, true, msg1);
            if (i === tests.length-1) tape.end();
        })
    },
    {
        desc: 'The feliz.observable static member',
        test: function(tape){
            tape.equal(typeof Feliz.observable, 'function', 'should be a function');
            const fn1 = Feliz.observable.toString();
            const fn2 = Observable.toString();
            tape.equal(fn1, fn2, 'should be the same function as rxjs');
            tape.end();
        }
    },
    {
        desc: 'The feliz.error static member',
        test: function(tape){
            tape.deepEqual(Feliz.error, FelizError, 'should be the feliz.error module');
            tape.equal(!!Feliz.error, true, 'should be a non falsy value');
            tape.equal(Feliz.error.constructor.name, 'Function', 'should be a function');
            tape.end();
        }
    },
    {
        desc: 'The feliz.util static member',
        test: function(tape){
            tape.deepEqual(Feliz.util, FelizUtil, 'should be the feliz.util module');
            tape.equal(!!Feliz.util, true, 'should be a non falsy value');
            tape.equal(Feliz.util.constructor.name, 'Object', 'should be an object');
            tape.end();
        }
    },
    {
        desc: 'The feliz.package static member',
        test: function(tape){
            tape.deepEqual(Feliz.package, Package, 'should be the same object as package.json');
            tape.equal(!!Feliz.package, true, 'should be a non falsy value');
            tape.equal(Feliz.package.constructor.name, 'Object', 'should be an object');
            tape.end();
        }
    },
    {
        desc: 'The returned feliz instance',
        test: tests
    }
];

Test(cases, Feliz).subscribe();
