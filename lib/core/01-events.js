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

    const validate = target => {
        if (!this.util.is(target).array())
            throw this.error.type({
                name: `${info.name}#validator`,
                type: 'Array',
                data: target
            });
        target.forEach(event => {
            if (!this.util.is(event).object())
                throw this.error.type({
                    name: `${info.name}#validator.event`,
                    type: 'Object',
                    data: event
                });
            if (!this.util.is(event.name).string())
                throw this.error.type({
                    name: `${info.name}#validator.event.name`,
                    type: 'String',
                    data: event.name
                });
            if (!this.util.is(event.data).function())
                throw this.error.type({
                    name: `${info.name}#validator.event.data`,
                    type: 'Function',
                    data: event.data
                });
        });
        return true;
    };

    this.set('events', events, {enumerable:false})

    // Register all events sent in configuration
    validate(this.conf.events);
    this.conf.events.forEach(ev => this.events.on(ev.name, ev.data))

    return this.observable.of(this);
}
