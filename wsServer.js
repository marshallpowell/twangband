var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: 3001 }),
    wav = require('wav'),
    moment = require('moment');


wss.on('connection', function connection(ws) {

    var fileWriter = null;
    var trackName = null;
    var receiveJSON = false;
    var receiveLatencyTime = false;
    var song = null;
    ws.on('message', function incoming(stream) {

        //console.log('stream: '+stream);
        if(stream == '--start-recording--'){
            console.log('received: %s', stream);
            receiveJSON = true;
        }
        else if(receiveJSON){

            console.log('json received: %s', stream);
            receiveJSON = false;
            trackName = /tmp/+moment().format('YYYYMMDDhhmmss')+'.wav';

            fileWriter = new wav.FileWriter(trackName, {
                channels: 1,
                sampleRate: 48000,
                bitDepth: 16
            });

            console.log('file name: ' + trackName);
        }
        else if(receiveLatencyTime){

            //calculate latency here

        }
        else if(stream == '--end-recording--'){
            console.log('received: %s', stream);
            receiveLatencyTime=true;
        }
        else if(receiveLatencyTime){

            //calculate latency here
            if (fileWriter != null) {
                console.log("close conn, end fileWriter");
                fileWriter.end();

                //ffmpeg file to ogg

                //save to song

                ws.send('new track: ' + trackName);

            }

        }
        else{

            if(fileWriter == null){
                //throw error
            }
            //stream data to file
            fileWriter.write(stream);

        }
    });

    ws.on('close', function () {
        console.log('closing connection');


    });

    ws.send('something');
});

console.log("started wsServer on port 3001!");