'use strict';

const Rx    = require('rxjs/Rx');
const FUtil = require('feliz.util');

module.exports = function(){
    return Rx.Observable.of(FUtil());
}

