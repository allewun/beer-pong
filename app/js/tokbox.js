// Initialize API key, session, and token...
// Think of a session as a room, and a token as the key to get in to the room
// Sessions and tokens are generated on your server and passed down to the client
var apiKey = "44627232";
var sessionId = "1_MX40NDYyNzIzMn5-U2F0IEphbiAyNSAyMTo1MTo1MyBQU1QgMjAxNH4wLjk0MjAxNDkzfg";
var token = "T1==cGFydG5lcl9pZD00NDYyNzIzMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1mMTVmYTNjYzAzZjAwYzY4ZDg2NmQwZmNmZDZmMTQ3NThhODBlOTkwOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9MV9NWDQwTkRZeU56SXpNbjUtVTJGMElFcGhiaUF5TlNBeU1UbzFNVG8xTXlCUVUxUWdNakF4Tkg0d0xqazBNakF4TkRremZnJmNyZWF0ZV90aW1lPTEzOTA3MTU1MTMmbm9uY2U9MC4zOTc1NDE2MjYyNzE3MDA0JmV4cGlyZV90aW1lPTEzOTA4MDE5MTMmY29ubmVjdGlvbl9kYXRhPQ==";

// Initialize session, set up event listeners, and connect
function sessionConnectedHandler(event) {
    var div = document.createElement('div');
    div.id = "opentok_publisher";

    var publisherContainer = document.getElementById('publisherContainer');
    publisherContainer.appendChild(div);

    var publisher = TB.initPublisher(apiKey, div.id, {width: 300, height: 225});
    session.publish(publisher);

    subscribeToStreams(event.streams);
}

function subscribeToStreams(streams) {
    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        if (stream.connection.connectionId != session.connection.connectionId) {
            var div = document.createElement('div');
            div.id = "opentok_subscriber_" + stream.streamId;

            var subscriberContainer = document.getElementById('subscriberContainer');
            subscriberContainer.appendChild(div);

            session.subscribe(stream, div.id, {width: 300, height: 225});
        }
    }
}

function streamCreatedHandler(event) {
    subscribeToStreams(event.streams);
}


var session  = TB.initSession(sessionId);
session.connect(apiKey, token);
session.addEventListener("sessionConnected",
                         sessionConnectedHandler);
session.addEventListener("streamCreated",
                         streamCreatedHandler);
