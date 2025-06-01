var constants = require('./constants');
var config = require('../config.json')

module.exports.app = function (router, port) {

    var debug = require('debug')('hotelsapi:server');
    const express = require('express');
    var http = require('http');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    var createError = require('http-errors');
    var logger = require('morgan');
    var app = express();
    const session = require('express-session')
    const path = require('path')
    const FileStreamRotator = require('file-stream-rotator')
    const morgan = require('morgan');
    const { connectDB, sequelize } = require('./db');


    var corsOptions = {
        origin: '*',
        credentials: true };

    (async () => {
        await connectDB();
        // Optionally sync models
        await sequelize.sync();
    })();

    app.use(cors(corsOptions));

    app.use(session({
        secret: config.session.secret_key,
        resave: false,
        rolling: true,
        saveUninitialized: true,
        cookie: {
            maxAge: config.session.maxage,
            secure: config.session.secure
        }

    }));

    var accessLogStream = FileStreamRotator.getStream({
        filename: path.join(__dirname, "../logs", 'access_%DATE%.log'),
        frequency: 'daily',
        verbose: false,
        date_format: 'YYYY-MM-DD'
    })

    morgan.token('remote-user', function getRemoteUserToken(req) {
        return req.user
         ? req.user.id
         : undefined
    })

    app.use(morgan(function(tokens, req, res) {
       // console.log(tokens)
        return [
            tokens.date(req, res, 'clf') || '-',
            tokens['remote-addr'](req, res) || '-',
            tokens['remote-user'](req, res) || '-',
            tokens.method(req, res) || '-',
            tokens.url(req, res) || '-',
            'HTTP/'+tokens['http-version'](req, res) || '-',
            tokens.referrer(req, res) || '-',
            tokens.status(req, res) || '-',
            tokens.res(req, res, 'content-length') || '-',
            tokens['response-time'](req, res)+'ms' || '-'+'0ms' ,
            tokens['user-agent'](req, res) || '-'
        ].join(' ')
    }, {stream: accessLogStream}));


    app.use(logger('dev'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));


    app.use(constants.ROUTE_PATH, router);

    app.use('*', function (req, res) {
        if (req.originalUrl == "/")
            return res.sendStatus(200);

        res.status(404)
        res.json({ "errormsg": "url is not found" })
    })

    app.use(function (req, res, next) {
        next(createError(404));
    });

    var port = normalizePort(process.env.PORT || port);
    app.set('port', port);

    var server = http.createServer(app);

    server.listen(port, '0.0.0.0');
    server.on('error', onError);
    server.on('listening', onListening);

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    function normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    function onListening() {
        var addr = server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
        console.log('Listening on ' + bind)
    }

},
module.exports.appWithRoute = function (route) {
    
    this.app(route, 8800);
        
}
