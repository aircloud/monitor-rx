const sockjs = require('sockjs');
const monitorRx = require('monitor-rx');
const lib = require('./lib');

let monitorServer = new monitorRx.Server({ RxModules: lib });

// 1. Echo sockjs server
const sockjs_opts = {
    prefix: '/echo'
};
const sockjs_echo = sockjs.createServer(sockjs_opts);

sockjs_echo.on('connection', function(conn) {
    console.log('websocket connection and this is a connection');
    let id;
    conn.on('close', () => {
        // reset
        console.log('get close, so unsubscribe...');
        if (id) {
            monitorServer.unSub(id);
        }
    });

    conn.on('data', async function(message) {
        try {
            if (typeof message === 'string') message = JSON.parse(message);
        } catch (e) {
            conn.write(JSON.stringify({result: -1, error: 'JSON parse error'}));
        }

        let querys = message.querys;

        for (let queryItem of querys) {

            if (queryItem.id) id = queryItem.id;

            monitorServer.sub(queryItem, {
                next: x => {
                    // console.log('got value' + JSON.stringify(x));
                    conn.write(JSON.stringify(Object.assign({}, x, { id: queryItem.id })));
                },
            });
        }

    });
});

module.exports = sockjs_echo;