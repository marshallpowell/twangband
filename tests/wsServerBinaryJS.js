var WebSocketServer = require('ws').Server,
    binaryServer = require('binaryjs').BinaryServer,
    path = require('path'),
    wav = require('wav'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    winston = require('winston');

var wss = binaryServer({ port: 3001 });

global.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug', handleExceptions: true, humanReadableUnhandledException: true}),
        new (winston.transports.File)({ filename: process.env.LOG_DIR + 'wsApp.log', level: 'debug', handleExceptions: true, humanReadableUnhandledException: true, maxsize : 200000, maxFiles : 10})
    ]
});

global.APP_ROOT = path.resolve(__dirname);
global.APP_LIB = APP_ROOT + "/lib/";
global.PUBLIC_APP_LIB = APP_ROOT + "/public/js/lib/";


//see this thread for error MongoError: topology was destroyed -- http://stackoverflow.com/questions/30909492/mongoerror-topology-was-destroyed
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var mongoUrl=process.env.MONGO_SERVICE_HOST + ':' + process.env.MONGO_SERVICE_PORT + '/' + process.env.MONGO_DB_NAME;
var trackService = require(APP_LIB + 'service/TrackService');
var songDao = require(APP_LIB + 'dao/SongDao');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var TrackDto = require(global.PUBLIC_APP_LIB+'models/TrackDto.js');
var RecordingResponseDto = require(global.PUBLIC_APP_LIB+'models/RecordingResponseDto.js');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');

mongoose.connect(mongoUrl, {
    server: {
        auto_reconnect: true,
        socketOptions : {
            keepAlive: 1
        }
    },
    user: process.env.TB_MONGO_DB_USER,
    pass: process.env.TB_MONGO_DB_PASS
});

mongoose.set('debug', true);

mongoose.connection.on('error', function(err){
    console.log("error connecting to mongoose " + err);
});

mongoose.connection.on('open', function() {
    console.log("connection to mongoose opened");
});

mongoose.connection.on('close', function() {
    console.log("connection to mongoose closed");
});

process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('SIGINT Mongoose connection closed');
        process.exit(0);
    });
});

//TODO implement ws error handling
var handleError = function(err){
    log.error('error thrown: ' + err);

    var responseDto = new RecordingResponseDto();
    responseDto.status='ERROR';
    responseDto.message=err;

    socket.send(JSON.stringify(responseDto));
};

var socket = null;

wss.on('connection', function connection(ws) {

    var fileWriter = null;
    var trackName = null;
    var receiveJSON = false;
    var songDto = null;
    var recordingDto = null;
    socket = ws;

    ws.on('data', function incoming(stream, meta) {
        stream.pipe(fileWriter);
    });

    ws.on('close', function(){

    });

    ws.on('stream', function incoming(stream, meta) {
        log.debug('stream looks like: ' + JSON.stringify(meta));
        //console.log('stream: '+stream);


        var event = 'recording';

        if(meta){
            var event = meta.event;
        }


        if(event === '--start-recording--'){
            log.debug('received: '+ stream);


            log.debug('json received: '+ stream);

            try{
                recordingDto = JSON.parse(meta.recordingDto);

                if(recordingDto==null || !recordingDto.songId){
                    throw('Invalid request');
                }
            }
            catch(err){
                handleError(err);
                return;
            }

            trackName = recordingDto.songId+'_'+recordingDto.userId+'_'+moment().format('YYYYMMDDhhmmss')+'.wav';

            //TODO, not sure about these settings. channels may need to be passed in if it stereo vs mono
            fileWriter = new wav.FileWriter(process.env.UPLOADS_DIR+trackName, {
                channels: 1,
                sampleRate: 44100,
                bitDepth: 16
            });

            stream.on('end', function() {
                fileWriter.end();
            });

            log.debug('file name: ' + trackName);

            //stream data to file
            stream.on('data', function (data) {
                //stream.pipe(fileWriter);
                fileWriter.write(data);
            });


            stream.on('end', function () {
                console.log('closing connection');

                // log.debug('received: '+ stream);
                fileWriter.end();
                trackService.compressTrack(trackName, recordingDto.latency).then(function(audioDataDto){
                    //create new track dto
                    var trackDto = new TrackDto();
                    trackDto.name='Track '+moment().format('YYYY-MM-DD hh:mm:ss');
                    trackDto.creatorId=recordingDto.userId;
                    dtoMapper.mapMediaMetaData(trackDto,audioDataDto);

                    log.debug('calling trackDao.createOrUpdateTrack');
                    trackService.createOrUpdateTrack(trackDto).then(function(dto){
                        trackDto = dto;

                        log.debug('calling addNewTrackToSong with dto: ' + JSON.stringify(trackDto));

                        songDao.addNewTrackToSong(recordingDto, dto).then(function(songDto){

                            var songTrackDto=null;

                            for(var i=0; i < songDto.tracks.length; i++){

                                if(trackDto.id == songDto.tracks[i].originalTrackId){

                                    var responseDto = new RecordingResponseDto();
                                    songDto.tracks[i].originalTrackDto = trackDto;
                                    responseDto.status='SUCCESS';
                                    responseDto.message='Saved new track successfully';
                                    responseDto.track = songDto.tracks[i];

                                    var responseJSON = JSON.stringify(responseDto);
                                    log.debug('responding with: ' + responseJSON);
                                    ws.send(responseJSON);

                                    trackService.updateTrackSearch(trackDto, songDto);

                                    return;
                                }
                            }

                        }, handleError);
                    }, handleError);

                    //add track to song

                    //return songTrackDto to client
                }, handleError).catch(handleError);

                return;

            });

        }


    });




});

console.log("started wsServer on port 3001!");