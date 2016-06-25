'use strict';

const ERRORS = [Error, TypeError, RangeError, ReferenceError, SyntaxError];

function Exception(template, options){
    const Instance = this;
    if (!options || options.constructor !== Object) options = { message:String(options) };
    Object
        .keys(options)
        .map(key => template = template.replace(`%${key}`, String(options[key])))
    return new Instance(template);
}

module.exports = function(){
    return [
        [null        , Error          , '%message']                                    ,
        ['type'      , TypeError      , 'Invalid %name. expecting %type; got: %data' ] ,
        ['range'     , RangeError     , 'TODO: Add an error message here' ]            ,
        ['reference' , ReferenceError , 'TODO: Add an error message here' ]            ,
        ['syntax'    , SyntaxError    , 'TODO: Add an error message here' ]
    ].reduce((acc, cur) => {
        let type = cur.shift();
        let bind = Exception.bind.apply(Exception, cur);
        if (type) acc[type] = bind;
        else acc = bind;
        return acc;
    }, null);
}
