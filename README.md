Hapi Rx
-------

A minimalistic wrapper for hapi.js to build servers


## Usage
__index.js__

    'use strict'
    const HapiRx = require('hapi-rx');

    const server$ = HapiRx({
        root: './app',
    });

    server$.subscribe(
        hapirx => console.log('Server running.'),
        err    => { throw err; }
    )

__app/routes.js__

    'use strict';

    const Joi = require('joi');

    module.exports = {

        '/{id?}': {
            method: 'GET',
            bundle: 'root',
            config: {
                cache: false,
                validate: {
                    params:{
                        id: Joi.string().regex(/[a-f0-9]{24}/)
                    }
                }
            }
        },

        'action':{
            method: 'SOCKET',
            bundle: 'socket'
        },

    }

__app/bundles/root/index.js__

    'use strict'

    module.exports = (request, reply){
        let path = this.path.bundles; // Access to the server instance
        if (request.params.id) return reply(`Hello ${request.params.id}`);
        reply('Hello world');
    }

__app/bundles/socket.js__

    'use strict'
    // Still in alpha
    module.exports = (type, data){
        // emited using channel: socket:test
        if (type == 'test'){
            // do something with data
        }
    }
