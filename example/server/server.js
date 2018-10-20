const Koa = require('koa');
const serve = require('koa-static');
const app = new Koa();
const path = require('path')
const http = require('http');

const sockjs_echo = require('./socket');

app.use(serve(path.join(__dirname, '/public')));

const server = http.createServer(app.callback());
sockjs_echo.installHandlers(server);

server.listen(9900);
console.log(' [*] Listening on 9900');
