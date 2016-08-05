'use strict';

module.exports = function(info){
    console.info('----->', this);
    return this.observable.of(null);
}
