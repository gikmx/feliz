'use strict';

const PATH = require('path');

/**
 * The configuration object needed to customise the behaviour of feliz.
 *
 * @module Configuration
 * @type object
 */
module.exports = {

    /**
     * The path of the application directory.
     * @type string
     * @kind __required__ property
     */
    root: null,

    /**
     * Paths available through the framework.
     *
     * Each of the elements of this object, will be parsed by
     * [Node's Path Module](https://nodejs.org/api/path.html).
     *
     * Every element must contain a `type` property that will be mapped to one of the
     * available module methods, and it also must contain an `args` property (an array)
     * that will be mapped to the arguments of given method.
     *
     * The property `args` can contain special string variables (wrapped by `${}`)
     * that can be replaced for anything of the following values:
     *
     * ##### Available variables
     * | name         | value                                                                          |
     * |--------------|--------------------------------------------------------------------------------|
     * | `__filename` | The full path pointing to the main module.                                     |
     * | `__dirname`  | The full path of the directory where the main module is located.               |
     * | `{property}` | Every `string` property defined on the 1st level of [Configuration](#module_Configuration). ie: `root` |
     *
     * ##### Default values
     * | name           | description                                | default                        |
     * |----------------|--------------------------------------------|--------------------------------|
     * | `path.ext`     | The default extension name                 | The same as the mainmodule.    |
     * | `path.root`    | The location of the application directory. | The one defined on `conf.root` |
     * | `path.bundles` | The location of the bundles directory.     | `conf.root/bundles`            |
     *
     * @type object
     * @kind __optional__ property
     */
    path: {
        sep     : { type:'join'    , args:[PATH.sep]            },
        ext     : { type:'extname' , args:['${__filename}']     },
        root    : { type:'join'    , args:['${root}']           },
        bundles : { type:'join'    , args:['${root}','bundles'] },
    },

    /**
     * A list of event listeners to setup on startup.
     * @type array
     * @kind __optional__ property
     */
    events: [],

    /**
     * A list of plugins to setup on startup.
     * @type array
     * @kind __optional__ property
     */
    plugins: []
}
