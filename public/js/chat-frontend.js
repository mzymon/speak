$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
    var user, pass;
    var connection;
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t '
                + 'support WebSockets.'
        }));
        input.hide();
        $('span').hide();
        return;
    }

    $("#submit").click(function () {
        user = $("#user").val();
        pass = $("#password").val();

        // open connection
        connection = new WebSocket(`ws://localhost:1337/${user}.${pass}`);


        connection.onopen = function () {
            // enable user input
            input.removeAttr('disabled');
            myName = user;
            status.text(myName + ': ')
        };

        connection.onerror = function (error) {
            // just in there were some problems with conenction...
            content.html($('<p>', {
                text: 'Sorry, but there\'s some problem with your '
                    + 'connection or the server is down.'
            }));
        };

        // most important part - incoming messages
        connection.onmessage = function (message) {
            // try to parse JSON message. Because we know that the server always returns
            // JSON this should work without any problem but we should make sure that
            // the massage is not chunked or otherwise damaged.
            try {
                var json = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }

            // NOTE: if you're not sure about the JSON structure
            // check the server source code above
            if (json.type === 'color') { // first response from the server with user's color
                myColor = json.data;
                status.text(myName + ': ').css('color', myColor);
                input.removeAttr('disabled').focus();
                // from now user can start sending messages
            }
            else if (json.type === 'history') { // entire message history
                // insert every single message to the chat window
                for (var i = 0; i < json.data.length; i++) {
                    addMessage(json.data[i].author, json.data[i].text,
                        json.data[i].color, new Date(json.data[i].time));
                }
            }
            else if (json.type === 'message') { // it's a single message
                input.removeAttr('disabled'); // let the user write another message
                addMessage(json.data.author, json.data.text,
                    json.data.color, new Date(json.data.time));
            }
            else if (json.type === 'recipient') {
                input.removeAttr('disabled'); // let the user write another message
                if (json.data == "") {
                    addMessage(myName, "unknown user",
                        myColor, new Date());
                }
                else {
                    content.html($('<p>', {
                        text: 'speak with '
                            + json.data
                    }));
                }
            }
            else {
                console.log('Hmm..., I\'ve never seen JSON like this: ', json);
            }
        };

        /**
         * Send mesage when user presses Enter key
         */
        input.keydown(function (e) {
            if (e.keyCode === 13) {
                var msg = $(this).val();
                if (!msg) {
                    return;
                }
                if (msg.startsWith("!speak")) {
                    var user = msg.substr(7);
                    connection.send(JSON.stringify({ type: 'speakTo', data: user }));
                }
                else {
                    // send the message as an ordinary text
                    connection.send(JSON.stringify({ type: 'message', data: msg }));
                }
                $(this).val('');
                // disable the input field to make the user wait until server
                // sends back response
                input.attr('disabled', 'disabled');

                // we know that the first message sent from a user their name
                if (myName === false) {
                    myName = msg;
                }
            }
        });

        /**
         * This method is optional. If the server wasn't able to respond to the
         * in 3 seconds then show some error message to notify the user that
         * something is wrong.
         */
        setInterval(function () {
            if (connection.readyState !== 1) {
                status.text('Error');
                input.attr('disabled', 'disabled');
                content.html($('<p>', {
                    text: 'Unable to communicate '
                        + 'with the WebSocket server.'
                }));
            }
        }, 3000);
    });
    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '"><b>' + author + '</b></span> <span style="color:#009EF7"> @' +
            + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ":"
            + (dt.getSeconds() < 10 ? '0' + dt.getSeconds() : dt.getSeconds())
            + '</span><span style="color:white">: ' + message + '</span></p>');
        var elem = document.getElementById('content');
        elem.scrollTop = elem.scrollHeight;
    }
});