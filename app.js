var watson = require('./watson');
const http = require('http');
var express = require('express');
var opn = require('opn');
var app = express();
//var port    = process.env.PORT || 3000;

const hostname = 'localhost';
const port = 3000;
const server = http.createServer(app);



app.use('/', express.static('public'));
app.get('/synthesize', (req, res, next) => {
  const transcript = watson.synthesize(req.query.text);
  transcript.on('response', (response) => {
    if (req.query.download) {
      if (req.query.accept && req.query.accept === 'audio/wav') {
        response.headers['content-disposition'] = 'attachment; filename=transcript.wav';
      } else {
        response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
      }
    }
  });
  transcript.on('error', next);
  transcript.pipe(res);
});

// my free number is 1(410) 204-2169
var twilio = require('twilio');

// Find your account sid and auth token in your Twilio account Console.
var client = new twilio('ACaf51e5cf6eb7cbe792ae1d86f30dbedd', '5842512a127539c71aa57d49b68d8141');


var io = require('socket.io')(server);
var ss = require('socket.io-stream');
io.on('connection', function (socket) {
  console.log("Connected");

  var context = {};
  socket.on('sendmsg', function (data) {
    watson.message(data.message, context, function(err, res){
      if(!err){
          console.log(res);
          context = res.context;
          if (res.output.action === 'VR_selection') {
            // User asked what time it is, so we output the local system time.
            console.log("1");
            opn('http://mombisonhacks.azurewebsites.net/');
          } else if (res.output.action === 'end') {
            // User said goodbye, so we're done.
              console.log(res.output.text[0]);
              endConversation = true;
        } else if (res.output.action === 'message1' ) {
          client.messages.create({
          to: '+14438086169',
          from: '+14102042169',
          body: 'Your wife that she want to die. Please support her.'
          });
        } else if (res.output.action === 'message2'){
          client.messages.create({
          to: '+14438086169',
          from: '+14102042169',
          body: 'Your wife has not have good sleeps recently. You should take care for her'
          });
        } else if (res.output.action === 'mapbox') {
          opn('file:///Users/jason/Desktop/MomBot/MapBox/Mapbox.html');
        } else if (res.output.action === 'playing_music'){
          if ("genes" === "Mozalt"){
          	opn('http://open.spotify.com/album/003UMPoJ8dQHS6J9wS2FrX');
          }
          else{
          	opn('http://open.spotify.com/album/0OzOn0BZANmXkpBatSrpJf');
          }
        }
        else {
            // Display the output from dialog, if any.
              if (res.output.text.length != 0) {
                console.log(res.output.text[0]);
            }
        }
        if (Array.isArray(res.output.text))
          conversation_response = res.output.text[0];//.join(' ').trim();
        else conversation_response = undefined;

        if(conversation_response){
          var payload = {
            user    : "System",
            message : conversation_response,
            ts      : (new Date()).getTime(),
            type    : data.type || 'text',
          };
          socket.emit('replymsg', payload);
        }
      }
    })
  });

  ss(socket).on('recognize', function(stream, data) {
    watson.recognize(stream, function(err){
      console.log('Error:', err);
    }, function(res){
      var transcript = res;
      socket.emit('transcript', {message: transcript, ts: data.ts});
      console.log(JSON.stringify(res, null, 2));
    })
  });
});
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
    opn(`http:/${hostname}:${port}`);
});
