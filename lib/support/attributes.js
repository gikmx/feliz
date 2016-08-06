/**
 * @class Attributes
 * @classdef The attributes an instance member will have.
 * @type object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty|Object.defineProperty()}
 *
 * @property {boolean} configurable - The member may be changed and/or deleted. <br>
 *                                    __Default__: `false`
 * @property {boolean} writable     - The member may be changed with an [assignment operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators) <br>
 *                                    __Default__: `false`
 * @property {boolean} enumerable   - The member wll show up during enumeration. <br>
 *                                    __Default__: `true`
 * @property {function} get         - Defines a getter for the property. <br>
 *                                    __Default__: `undefined`
 * @property {function} set         - Defines a setter for the property. <br>
 *                                    __Default__: `undefined`
 */
module.exports = {
    configurable: false,
    writable    : false,
    enumerable  : true
};
