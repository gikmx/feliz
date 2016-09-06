'nse strict'

const EVENTS = require('events');

const Memory    = new WeakMap();
const Internals = new WeakMap();

/**
 * The main event handler
 * @name module:feliz#events
 * @type module:Events
 * @see {@link module:Events}
 */
module.exports = function(info){

    // create the event handler
    events = new Events({ feliz: this, events: new InternalEvents() });
    Memory.set(this, events);

    // Declare getter/setter and establish the initial value
    this.set('events', null, {
        get: getter.bind(this),
        set: setter.bind(this)
    });
    this.events = this.conf.events || [];

    // everything is ready for the first event to be set.
    // everytime the configurarion has an update, make sure the events are updated too.
    this.events.on('core:conf.setter', function(e, conf){
        if (!conf.events) return;
        this.debug('events', 'update', conf.events);
        this.events = conf.events;
    });

    // No need of async operations.
    return this.observable.of(this);
}

/**
 * The event setter
 */
function setter(events){
    validator.call(this, events);
    this.debug('events', 'setter', events.length, events);
    events.forEach(event => this.events.on(event.name, event.call))
}

/**
 * The event getter
 */
function getter(){
    let events = Memory.get(this);
    this.debug('events', 'getter', events.length, events);
    return events;
}

/**
 * Validates events sent by the user
 * @name module:feliz#events.validator
 * @method
 * @private
 * @param {object} info - The module info
 * @param {array} events - The events configuration
 */
function validator(events){
    if (!this.util.is(events).array())
        throw this.error.type({ name:'events.validator', type: 'Array', data: events });
    events.forEach(event => {
        if (!this.util.is(event).object())
            throw this.error.type({
                name: 'events.validator',
                type: 'Object',
                data: event
            });
        if (!this.util.is(event.name).string())
            throw this.error.type({
                name: 'events.validator.name',
                type: 'String',
                data: event.name
            });
        if (!this.util.is(event.call).function())
            throw this.error.type({
                name: 'events.validator.call',
                type: 'Function',
                data: event.call
            });
    });
    this.debug('events','validator', events.length, events);
    return true;
}

class InternalEvents extends EVENTS {}

/**
 * Minimalistic internal event handler.
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
        const event = {name, call};
        feliz.debug('events','on', name, event);
        validator.call(feliz, [event]);
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
        feliz.debug('events', 'emit', name, ...values);
        return events.emit(name, ...values);
    }

    raw(){
        return Array.prototype.slice.call(this);
    }

    internal(){
        const {feliz,events} = Internals.get(this);
        return events;
    }
}

