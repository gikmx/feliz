'use strict';

const PATH = require('path');
const {Observable} = require('rxjs/Rx');
const Feliz = require('../lib/feliz');

class Tests extends Array {
    stream (filter){
        if (!filter) filter = () => true;
        return Observable
            .from(this)
            .mergeMap(test => (new Feliz(test.conf))
                .filter(filter)
                .map(feliz => Object.assign({out:feliz}, test))
                .catch(error => Observable.of(Object.assign({out:error}, test)))
            );
    }
}

const path = { root: PATH.join(__dirname, 'app') };
path.empty = PATH.join(path.root, 'empty');

const tests = module.exports = new Tests();

tests.push({
    desc: 'no conf sent',
    conf: null,
    pass: false
});

tests.push({
    desc: 'falsy value on conf.root',
    conf: {root:null},
    pass: false
});

tests.push({
    desc: 'inexistent relative dir on conf.root',
    conf: {root:'./zxcvlzck'},
    pass: false
});

tests.push({
    desc: 'inexistent absolute dir on conf.root',
    conf: {root:'/hjshs/zxcvlzck'},
    pass: false
});

tests.push({
    desc: 'empty existent dir on conf.root',
    conf: { root:path.empty },
    pass: true
});
