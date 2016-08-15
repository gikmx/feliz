'use strict'

const EVENTS = require('events');

class Events extends EVENTS {}

/**
 * The main event handler
 * @name module:feliz#events
 * @type module:Events
 * @see {@link module:Events}
 */
module.exports = function(info){

    const events = new Events();
    const eventsOn = events.on;

    events.on = (name, callback) => {
        this.debug(`${info.name}.trigger`, {name,callback});
        if (!this.util.is(callback).function())
            throw this.error.type({
                name: `${info.name}#on.callback`,
                type: 'Function',
                data: callback
            });
        if (!this.util.is(name).string())
            throw this.error.type({
                name: `${info.name}#on.name`,
                type: 'String',
                data: name
            })
        return eventsOn.call(events, name, callback.bind(this));
    }

    // Validate configuration sent
    const validate = target => {
        this.debug(`${info.name}.validate`, target);
        if (!this.util.is(target).object())
            throw this.error.type({
                name: `${info.name}#validator`,
                type: 'Object',
                data: target
            });
        // trigger declaration
        if (!target.on) target.on = [];
        if (!this.util.is(target.on).array())
            throw this.error.type({
                name: `${info.name}#validator:on`,
                type: 'Array',
                data: target.on
            });
        target.on.forEach(event => {
            if (!this.util.is(event).object())
                throw this.error.type({
                    name: `${info.name}#validator:on`,
                    type: 'Object',
                    data: event
                });
            if (!this.util.is(event.name).string())
                throw this.error.type({
                    name: `${info.name}#validator:on.name`,
                    type: 'String',
                    data: event.name
                });
            if (!this.util.is(event.data).function())
                throw this.error.type({
                    name: `${info.name}#validator:on.data`,
                    type: 'Function',
                    data: event.data
                });
        });
        return true;
    };

    this.set('events', events, {enumerable:false})

    // Register all events sent in configuration
    validate(this.conf.events);
    this.conf.events.on.forEach(ev => {
        this.debug(`${info.name}.register`, ev);
        return this.events.on(ev.name, ev.data)
    });

    return this.observable.of(this);
}
