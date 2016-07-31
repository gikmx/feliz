'use strict';

const Test  = require('tape');
const Feliz = require('../lib/feliz');

Test('this should pass', function(tape){
    tape.doesNotThrow(()=> {
        Feliz()
        tape.end();
    })
})
