[![Build Status](https://travis-ci.org/gikmx/feliz.svg?branch=master)](https://travis-ci.org/gikmx/feliz)
[![Coverage Status](https://coveralls.io/repos/github/gikmx/feliz/badge.svg?branch=master)](https://coveralls.io/github/gikmx/feliz?branch=master)
<br>
[![NPM](https://nodei.co/npm/feliz.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/feliz/)

# feliz.js
The quickest wat to kickstart the development of your app.

## Compatibility

* Node v6.2+
* MacOS, Linux, Windows (untested)

## Overview
By itself, this module doesn't really do much, it actually just enables a simple [hapi.js](http://github.com/hapijs/hapi)
server and adds some routing sugar here and there.

To unleash the full power of the wrapper, you should take a look to the
[plugin list](https://github.com/gikmx?query=feliz-), specially those that enable
bundle management.

If you need to start right away, you can also take a look to the
[presets list](https://github.com/gikmx?query=feliz.preset) to see if one of the defined
flavors of development suits your needs.

There's also an [example website](http://github.com/hectormenendez/gik.website) where you can
take a look of how this module can be used while the documentation is completed.

## Installation

There are few prerequisites to run, it's just a matter of creating a file structure
really.

First, like always, install the dependencies with `npm`:

```bash
npm i -S feliz feliz-{pluginName} feliz.preset-{presetName}
```

Then you have to decide the name of your application directory (we suggest `app`),
and create a subdirectory named `bundles` inside of it.

```bash
mkdir -p app/bundles
```

Once done that, create a file named: `routes.js` and use the following as contents.

```bash
touch app/routes.js
```
```javascript
// app/routes.js
module.exports = {
    '/':{bundle:'root'}
}
```

That will tell `Feliz` to add a route in `/` thar will be handled for a file inside
the bundles directory named `root.js` (it can also be `root/index.js`).

Create the file and add the following contents:

```bash
touch app/bundles/root.js
```

```javascript
// app/bundles/root.js
module.exports = function(request, reply){
    reply('Hello world!');
}
```

That's your first route handler, don't worry, there's plenty of documentation about those
on [hapi.js](http://github.com/hapijs/hapi), so you can start right away building your own
servers, websites, APIs or whatever you imagine.

But what's missing? you're right, what's th app entry point? and what does Feliz do?

Let' deal with the app entry point first, create the following file and contents:

```bash
touch index.js
```

```js
// index.js
const Feliz = require('feliz');
const feliz$ = Feliz({root: './app'});

feliz$.subscribe(
    feliz => console.log('ready', feliz.server.info),
    error => console.error('error', error)
);
```

And that's it, that's your entry point, and that's the server configuration (at least
in its most basic form). If you don't know anything about that latter dollar sign on
feliz$, you don't really have to worry much about it. (But you should really, really
think about learning about it [here](https://github.com/ReactiveX/rxjs)). At this point,
you just should know that the first function is going to be called when the feliz instance
(and the server) are ready for you to use, and the parameter called `feliz` will enclose
the main functionality of this module. The second function is a stream of errors,
everytime an error ocurs on the server (or on any other part of feliz) that function will
be called for you, containing given error.

Oh, an remember the route handler located on `app/bundles/root.js`? well, that function's
scope contains the same instance (feliz) you just learned about. where, you ask? let's go
back to that file and find out then.

```javascript
// app/bundles/root.js
module.exports = function(request, reply){
    console.log(this.server.info)
    reply('Hello world!');
}
```
See something familiar? but hey, let's see if everything works as expected, try it
yourself!

just run `index.js` with `node`, let it load and check out your route!

But what else can it do? almost everything you want, Feliz is like a toolbox at your
disposal to extend the base functionality of hapi.js and related tools. you'll see.

But since the API documentation is still a work in progress (and its definition as well)
you'll have to rely on some examples (or maybe help me writing some documentation?)

Anyways, checkout [gikmx.website](http://github.com/hectormenendez/gik.website) for an
usage example, hopefully it will help you while this documentation is completed.

---

## API Documentation (WIP)
### Table of contents

* [feliz](#module_feliz) ⇒ <code>[Observable](#Observable)</code>
    * _instance_
        * [.conf](#module_feliz+conf) : <code>[Configuration](#module_Configuration)</code>
        * [.events](#module_feliz+events) : <code>[Events](#module_Events)</code>
        * [.path](#module_feliz+path) : <code>object</code>
        * [.package](#module_feliz+package) : <code>object</code>
        * [.observable](#module_feliz+observable) : <code>object</code>
        * [.error](#module_feliz+error) : <code>object</code>
        * [.util](#module_feliz+util) ⇒ <code>object</code>
        * [.set(key, value, attr)](#module_feliz+set) ⇒ <code>mixed</code>
    * _static_
        * [.package](#module_feliz.package) ⇒ <code>object</code>
        * [.error](#module_feliz.external_error) ⇒ <code>object</code>
        * [.util](#module_feliz.external_util) ⇒ <code>object</code>
        * [.observable](#module_feliz.external_observable) ⇒ <code>object</code>

### Feliz(conf)
The wrapper simply consists in a function that - when called - returns an observable
containing either the instance (with among other stuff an initialize server) and/or
a stream of errors found either on the initialization stage or afterwards.

**Returns**: <code>[Observable](#Observable)</code> - Either the instance, or a stream of errors.  
**See**: [Configuration](#module_Configuration)  

| Param | Type | Description |
| --- | --- | --- |
| conf | <code>[Configuration](#module_Configuration)</code> | An object containig the configuration for each part                               of the framework. |

**Example**  
```js
const Feliz = require('feliz');
const feliz$ = Feliz({root:'./app'});
feliz$.subscribe(
    feliz => console.log('feliz is ready'),
    error => console.error(error);
);
```

if you wish to have more than once instance of Feliz running, use 'new'
to instantantiate it, otherwise the same instance will be returned every time.
__Please bear in mind this is an experimental feature.__ So it's recommended to
only use the non-instantiated version of feliz.
**Example**  
```js
const Feliz = require('feliz');
const feliz$1 = new Feliz({root:'./app'});
const feliz$2 = new Feliz({root:'./your-other-app'});
...
```
<a name="module_feliz+conf"></a>

### feliz.conf : <code>[Configuration](#module_Configuration)</code>
The configuration sent as parameter extended by defaults.

**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [Configuration](#module_Configuration)  
**Example**  
```js
// Assume this is the default configuration
// { foo:'bar', baz:true }
...
feliz => {
    feliz.conf = { foo:false };
    console.log(feliz.conf); // { foo:false, baz:true }
}
...
```
<a name="module_feliz+events"></a>

### feliz.events : <code>[Events](#module_Events)</code>
The main event handler

**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [Events](#module_Events)  
<a name="module_feliz+path"></a>

### feliz.path : <code>object</code>
A path resolver extended by defaults

**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [path](#module_Configuration.path)  
**Todo**

- [ ] Allow custom context.
- [ ] Determine if path validation should occur.
      Given the nature of the parser (using Node's Path module in its entirety)
      it's not possible to ensure that every property is actually a path
      ie: `path.ext`. so validation doesn't make sense as of now.

**Example**  
```js
// Assuming these are the default paths
// { ext:'.js', root:'/path/to/app' }

// You add some more defaults previous to instantiation
const feliz$ = Feliz({
  ...
  path: { common: { type:'join', args:['${root}', 'common'] } },
  ...
});

feliz$.subscribe(
  feliz => {
    // and then you add even more.
    feliz.path = {
      'master': { type:'join', args:['${root}', 'master'] }
    };

    console.log(feliz.path);
    // {
    //   ext    : '.js',
    //   root   : '/path/to/app',
    //   common : '/path/to/app/commmon',
    //   master : '/path/to/app/master'
    // }
  }
)
```
<a name="module_feliz+package"></a>

### feliz.package : <code>object</code>
**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.package](#module_feliz.package)  
<a name="module_feliz+observable"></a>

### feliz.observable : <code>object</code>
**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.observable](module:feliz.observable)  
<a name="module_feliz+error"></a>

### feliz.error : <code>object</code>
**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.error](module:feliz.error)  
<a name="module_feliz+util"></a>

### feliz.util ⇒ <code>object</code>
**Kind**: instance property of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.util](module:feliz.util)  
<a name="module_feliz+set"></a>

### feliz.set(key, value, attr) ⇒ <code>mixed</code>
The instance setter, if you want to add new members to the feliz instance, this is
the way of doing it. Avoid directly modifying the instance.

__Note__: If you send a setter/getter as attribute, the `value`, and
          the attributes `writable` and `configurable` will be ignored.

**Kind**: instance method of <code>[feliz](#module_feliz)</code>  
**Returns**: <code>mixed</code> - The assigned value.  
**See**: [Attributes](#Attributes)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The member name. |
| value | <code>mixed</code> | The value that will be assigned to given member. |
| attr | <code>[Attributes](#Attributes)</code> | The attributes the member will have. |

<a name="module_feliz.package"></a>

### feliz.package ⇒ <code>object</code>
The parsed representation of the `package.json` file.

**Kind**: static property of <code>[feliz](#module_feliz)</code>  
**See**: [package.json](https://github.com/gikmx/feliz/blob/master/package.json)  
<a name="module_feliz.external_error"></a>

### feliz.error ⇒ <code>object</code>
Error handling methods

**Kind**: static external of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.error](http://github.com/gikmx/feliz.error)  
<a name="module_feliz.external_util"></a>

### feliz.util ⇒ <code>object</code>
General utilities

**Kind**: static external of <code>[feliz](#module_feliz)</code>  
**See**: [feliz.util](http://github.com/gikmx/feliz.util)  
<a name="module_feliz.external_observable"></a>

### feliz.observable ⇒ <code>object</code>
A constructor to build observables

**Kind**: static external of <code>[feliz](#module_feliz)</code>  
**See**: [RxJS](http://github.com/ReactiveX/rxjs)  

---

<a name="module_Configuration"></a>

## Configuration : <code>object</code>
The configuration object needed to customise the behaviour of feliz.


* [Configuration](#module_Configuration) : <code>object</code>
    * [.root](#module_Configuration.root) : <code>string</code>
    * [.path](#module_Configuration.path) : <code>object</code>
    * [.events](#module_Configuration.events) : <code>array</code>

<a name="module_Configuration.root"></a>

### Configuration.root : <code>string</code>
The path of the application directory.

**Kind**: static __required__ property of <code>[Configuration](#module_Configuration)</code>  
<a name="module_Configuration.path"></a>

### Configuration.path : <code>object</code>
Paths available through the framework.

Each of the elements of this object, will be parsed by
[Node's Path Module](https://nodejs.org/api/path.html).

Every element must contain a `type` property that will be mapped to one of the
available module methods, and it also must contain an `args` property (an array)
that will be mapped to the arguments of given method.

The property `args` can contain special string variables (wrapped by `${}`)
that can be replaced for anything of the following values:

##### Available variables
| name         | value                                                                          |
|--------------|--------------------------------------------------------------------------------|
| `__filename` | The full path pointing to the main module.                                     |
| `__dirname`  | The full path of the directory where the main module is located.               |
| `{property}` | Every `string` property defined on the 1st level of [Configuration](#module_Configuration). ie: `root` |

##### Default values
| name           | description                                | default                        |
|----------------|--------------------------------------------|--------------------------------|
| `path.ext`     | The default extension name                 | The same as the mainmodule.    |
| `path.root`    | The location of the application directory. | The one defined on `conf.root` |
| `path.bundles` | The location of the bundles directory.     | `conf.root/bundles`            |

**Kind**: static __optional__ property of <code>[Configuration](#module_Configuration)</code>  
<a name="module_Configuration.events"></a>

### Configuration.events : <code>array</code>
Custom events auto triggering by default.

**Kind**: static __optional__ property of <code>[Configuration](#module_Configuration)</code>  

---

<a name="module_Events"></a>

## Events : <code>EventEmitter</code>
An instance of Node's Events interface to hook into different parts of feliz's process.

**See**: [Node's Events interface](https://nodejs.org/api/events.html)  

---

<a name="Attributes"></a>

## Attributes : <code>object</code>
**Kind**: global class  
**Classdef**: The attributes an instance member will have.  
**See**: [Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| configurable | <code>boolean</code> | The member may be changed and/or deleted. <br>                                    __Default__: `false` |
| writable | <code>boolean</code> | The member may be changed with an [assignment operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators) <br>                                    __Default__: `false` |
| enumerable | <code>boolean</code> | The member wll show up during enumeration. <br>                                    __Default__: `true` |
| get | <code>function</code> | Defines a getter for the property. <br>                                    __Default__: `undefined` |
| set | <code>function</code> | Defines a setter for the property. <br>                                    __Default__: `undefined` |

<a name="Observable"></a>

## Observable
**Kind**: global class  
**Classdef**: The observable type returned by [rxjs](http://github.com/reactivex/rxjs)  
**See**: [RxJS](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html)  

---

## License
The MIT License (MIT)

Copyright (c) 2016 Héctor Adán Menéndez Rivera

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
