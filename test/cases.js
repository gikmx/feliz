'use strict';

const PATH = require('path');
const {Observable} = require('rxjs/Rx');

class Tests extends Array { stream (){ return Observable.from(this) } }

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

tests.push({
    desc: 'valid conf.root with non-object conf.path',
    conf: { root:path.empty, path: null },
    pass: false
});

const expectedDefaultPath = {
    ext     : '',
    root    : path.empty,
    bundles : PATH.join(path.empty,'bundles')
}

tests.push({
    desc: 'valid conf.root with empty object con conf.path',
    conf: { root:path.empty, path: {} },
    pass: true,
    cbak: (t, test) => {
        if (test.out instanceof Error) return;
        const feliz = test.out;
        const msg = `should have path umodified when ${test.desc}`;
        t.deepEqual(feliz.path, expectedDefaultPath, msg);
    }
});

tests.push({
    desc: 'valid conf.root with non-object path definition',
    conf: { root:path.empty, path:{test:null} },
    pass: false
})

tests.push({
    desc: 'valid conf.root with empty path definition',
    conf: { root:path.empty, path:{test:{}} },
    pass: false
})

tests.push({
    desc: 'valid conf.root with invalid path defintiion',
    conf: { root:path.emptu, path: {test:{ type:'iDontExist', args:[1,2] }} },
    pass: false,
})

tests.push({
    desc: 'valid conf.root with custom conf.path',
    conf: {
        root: path.empty,
        path: { test: { type:'join', args:['${root}', 'test'] } }
    },
    pass: true,
    cbak: (t,test)=> {
        if (test.out instanceof Error) return;
        const msg = `should have correctly created path when ${test.desc}`;
        const pth = { test: PATH.join(path.empty, 'test') };
        t.deepEqual(test.out.path, Object.assign(pth, expectedDefaultPath), msg);
    }
})

tests.push({
    desc: 'valid conf.root with complex conf.path',
    conf: {
        root: path.empty,
        path: {
            'root.hello'   : { type : 'join', args : ['1']     } ,
            'root.one.two' : { type : 'join', args : ['1','2'] } ,
            'root.one.one' : { type : 'join', args : ['1','1'] } ,
            'bundles.test' : { type : 'join', args : ['hola']  } ,
            'hola.test'    : { type : 'join', args : ['/hola'] }
        }
    },
    pass:true,
    cbak: (t, test) => {
        const pth = Object.assign({}, expectedDefaultPath);
        const msg = `should have correctly created path when ${test.desc}`;
        pth.root = {hello:'1', one:{two:'1/2', one:'1/1'}};
        pth.bundles = {test:'hola'};
        pth.hola = {test:'/hola'};
        t.deepEqual(pth, test.out.path, msg);
    }
});

tests.push({
    desc: 'valid.conf with simple event declaration',
    conf: { root: path.empty, events: [
        {name:'core:events', data: function(t, test){}},
    ]},
    pass: true,
    cbak: (t, test) => {
        if (test.out instanceof Error) return;
        const pass = test.out.events._events['core:events'] !== undefined;
        t.equal(pass, true, `should emit an event when ${test.desc}`);
    }
})
