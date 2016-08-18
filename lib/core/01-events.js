'use strict'

const EVENTS = require('events');

class InternalEvents extends EVENTS {}

const Memory    = new WeakMap();
const Internals = new WeakMap();

/**
 * The main event handler
 * @name module:feliz#events
 * @type module:Events
 * @see {@link module:Events}
 */
module.exports = function(info){

    // Declare getter/setter and establish the initial value
    this.set('events', null, {
        get: getter.bind(this, info),
        set: setter.bind(this, info)
    });
    this.events = this.conf.events;

    // everytime the configurarion has an update, make sure the events are updated too.
    this.events.on('core:conf.set', function(conf){
        if (!conf.events) return;
        this.events = conf.events;
    });

    // No need of async operations.
    return this.observable.of(this);
}

function getter(info){
    let events = Memory.get(this);
    if (!events) events = new Events({
        feliz  : this,
        events : new InternalEvents()
    });
    Memory.set(this, events);
    this.debug(`${info.name}.getter`, Array.prototype.slice.call(events));
    return events;
}

function setter(info, events){
    this.debug(`${info.name}.setter`, Array.prototype.slice.call(events));
    validator.call(this, info, events);
    this.events
        .concat(events)
        .forEach(event => this.events.on(event.name, event.call))
}

/**
 * Validates events sent by the user
 * @name module:feliz#events.validator
 * @method
 * @private
 * @param {object} info - The module info
 * @param {array} events - The events configuration
 */
function validator(info, events){
    this.debug(`${info.name}.validator`, events);
    if (!this.util.is(events).array())
        throw this.error.type({
            name: `${info.name}#validator`,
            type: 'Array',
            data: events.on
        });
    events.forEach(event => {
        if (!this.util.is(event).object())
            throw this.error.type({
                name: `${info.name}#validator`,
                type: 'Object',
                data: event
            });
        if (!this.util.is(event.name).string())
            throw this.error.type({
                name: `${info.name}#validator.name`,
                type: 'String',
                data: event.name
            });
        if (!this.util.is(event.call).function())
            throw this.error.type({
                name: `${info.name}#validator.call`,
                type: 'Function',
                data: event.call
            });
    });
    return true;
}

/**
 * Minimalistic internal event handler.
 *
 * @module Events
 */
class Events extends Array {

    constructor(internals){
        super();
        Internals.set(this, internals);
    }

    /**
    * Registers an event listener
    * @name module:Events.on
    * @method
    * @param {string} name - The name of the event to be registered.
    * @param {function} call - The function to be called when the target event emits.
    * @return {EventEmitter}
    */
    on(name, call){
        const {feliz,events} = Internals.get(this);
        const info  = {name:`events:${name}`};
        const event = {name, call};
        feliz.debug(`${info.name}.on`, event);
        validator.call(feliz, info, [event]);
        this.push(name);
        return events.on(name, call.bind(feliz, event))
    }

    /**
    * Emits an event. Any listener with this name will trigger
    * @name module:Events.emit
    * @method
    * @param {string} name - The name of the event to be emitted.
    * @param {mixed} ...values - Indefinite number of arguments to be sent to the listener.
    * @return {boolean} Wether the emition had listeneres or not.
    */
    emit(name, ...values){
        const {feliz,events} = Internals.get(this);
        feliz.debug(`events:${name}.emit`, name, ...values);
        return events.emit(name, ...values);
    }
}

