var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();
const router = express.Router();

require('dotenv').config();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'shit-happy_poo_face_emoji-512.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        res.status(401);
        res.render('error 401: authentication error');
        return res.status.json({ message: 'Invalid Token' });
    }
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
    const matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) {
        return;
    }
    const name = matches[1];
    const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
    hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});





// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var database = require('./database.js');
/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];
var activeUsers = [];
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function (a, b) { return Math.random() > 0.5; });

/**
 * HTTP server
 */
var server = http.createServer();

server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var user = request.resource.substr(1).split(".");
    database.getUserIdCheckingPassword(user[0], user[1], function (userID) {
        if (userID != 0) {
            var connection = request.accept(null, request.origin);
        }
        else {
            var connection = request.reject(500, "authentication failed");
            return;
        }

        // we need to know client index to remove them on 'close' event
        var connectionIndex = clients.push(connection) - 1;
        activeUsers.push({ index: connectionIndex, userID: userID });
        var userName = user[0];
        var userColor = false;
        var recipientID = 0;
        console.log((new Date()) + ' Connection accepted.');

        // get random color and send it back to the user
        userColor = colors.shift();
        connection.sendUTF(JSON.stringify({ type: 'color', data: userColor }));
        console.log((new Date()) + ' User is known as: ' + userName
            + ' with ' + userColor + ' color.');

        //get history from db
        database.getUserMessages(0, function (messagesHistory) {
            var data = messagesHistory.recordset;
            var hist = [];
            for (var i = 0; i < data.length; i++) {
                var obj = {
                    time: data[i].dateTime,
                    text: htmlEntities(data[i].message.trim()),
                    author: data[i].senderID,
                    color: 'red'
                };
                console.log(obj);
                hist.push(obj);

            }
            if (hist.length > 0) {
                connection.sendUTF(JSON.stringify({ type: 'history', data: hist }));
            }
        });

        // user sent some message
        connection.on('message', function (message) {
            if (message.type === 'utf8') { // accept only text

                var json;
                try {
                    json = JSON.parse(message.utf8Data);
                }
                catch (e) {
                    console.log('This doesn\'t look like a valid JSON: ', message.utf8Data);
                    return;
                }
                if (json.type === 'message') {
                    // log and broadcast the message
                    console.log((new Date()) + ' Received Message from '
                        + userName + ': ' + json.data);

                    // we want to keep history of all sent messages
                    var obj = {
                        time: (new Date()).getTime(),
                        text: htmlEntities(json.data),
                        author: userName,
                        color: userColor
                    };
                    history.push(obj);
                    history = history.slice(-100);

                    
                    if (recipientID == 0) {
                        var responseJson = JSON.stringify({ type: 'messagePublic', data: obj });
                        // broadcast message to all connected clients if no user selected
                        for (var i = 0; i < clients.length; i++) {
                            clients[i].sendUTF(responseJson);
                        }
                    }
                    else {
                        var responseJson = JSON.stringify({ type: 'messagePrivate', data: obj });
                        //send message to user
                        connection.sendUTF(responseJson);
                        for (var i = 0; i < activeUsers.length; i++) {
                            if (activeUsers[i].userID == recipientID) {
                                clients[activeUsers[i].index].sendUTF(responseJson);
                            }
                        }
                        // broadcast message to a specific connected client
                        //check if client is avaiable first

                    }

                    //save message to db
                    database.saveUsersMessages(recipientID, userID, json.data);
                }

                else if (json.type === 'speakTo') {

                    var recipientName = json.data;
                    database.getUserId(recipientName, function (recipient) {
                        recipientID = recipient;
                        if (recipientID != 0) {
                            connection.sendUTF(JSON.stringify({ type: 'recipient', data: recipientName }));

                            //send history
                            database.getMessagesBetweenUsers(recipientID, userID, function (messagesHistory) {
                                var data = messagesHistory.recordset;
                                var hist = [];
                                for (var i = 0; i < data.length; i++) {
                                    var obj = {
                                        time: data[i].dateTime,
                                        text: htmlEntities(data[i].message.trim()),
                                        author: data[i].senderID,
                                        color: 'white'
                                    };
                                    console.log(obj);
                                    hist.push(obj);

                                }
                                if (hist.length > 0) {
                                    connection.sendUTF(JSON.stringify({ type: 'history', data: hist }));
                                }
                            });
                        }
                        else {
                            connection.sendUTF(JSON.stringify({ type: 'recipient', data: "all users" }));
                            
                            //get history from db
                            database.getUserMessages(0, function (messagesHistory) {
                                var data = messagesHistory.recordset;
                                var hist = [];
                                for (var i = 0; i < data.length; i++) {
                                    var obj = {
                                        time: data[i].dateTime,
                                        text: htmlEntities(data[i].message.trim()),
                                        author: data[i].senderID,
                                        color: 'red'
                                    };
                                    console.log(obj);
                                    hist.push(obj);

                                }
                                if (hist.length > 0) {
                                    connection.sendUTF(JSON.stringify({ type: 'history', data: hist }));
                                }
                            });
                        }
                    });


                }
            }

        });

        // user disconnected
        connection.on('close', function (connection) {
            if (userName !== false && userColor !== false) {
                console.log((new Date()) + " Peer "
                    + connection.remoteAddress + " disconnected.");
                // remove user from the list of connected clients
                clients.splice(connectionIndex, 1);
                // push back user's color to be reused by another user
                colors.push(userColor);
            }
        });
    });
});

module.exports = app;
