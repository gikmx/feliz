'use strict';

const Rx     = require('rxjs/Rx');
const FError = require('feliz.error');

module.exports = function(){
    const error = FError();
    return Rx.Observable.of(error);
}
