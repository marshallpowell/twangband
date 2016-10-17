var micWorker,
    sampleRate,
    numChannels,
    ws,
    stream,
    recordingDto,
    responseDto,
    wsCompletedResponseReceived = false,
    killTime,
    baseUrl;

micWorker = this;

var window = self;
//window.BlobBuilder = new Blob();
importScripts('/js/lib/binary.min.js');

this.onmessage = function(e){

    switch(e.data.command){
        case 'init':
            init(e.data.config);
            break;
        case 'record':
            record(e.data.buffer);
            break;
        case 'endRecording':
            endRecording(e.data.config);
            break;
        case 'waitForWebSocketResponse':
            waitForWebSocketResponse();
            break;
        case 'waitForConnection':
            waitForConnection();
            break;
    }
};


function init(config){
    console.log("enter init");
    sampleRate = config.sampleRate;
    numChannels = config.numChannels;
    recordingDto = config.recordingDto;
    baseUrl = config.baseUrl;

    createWs();
}

/**
 * creates the web socket
 */
function createWs(){

    console.log("enter createWs");

    wsCompletedResponseReceived = false;

    ws = new BinaryClient('wss://'+baseUrl+'/ws/');



    ws.on('open', function open(event) {
        console.log('---------------------------------------------------- connected');
        stream = ws.createStream({event : '--start-recording--', recordingDto: JSON.stringify(recordingDto)});

        stream.on('data',function (event) {

            console.log("enter onmessage");
            console.log(event.data);
            responseDto = JSON.parse(event.data);
            wsCompletedResponseReceived = true;
            ws.close();

        });

    });

    ws.on('close',function(event){
        console.log("enter onclose");
    });

    ws.on('error', function(event){
        console.log('error connecting: ' + event);
        micWorker.postMessage({command: 'errorConnecting'});
        return;
    });

}
var logme = true;

/**
 * send recording to server
 * @param inputBuffer
 */
function record(inputBuffer){

    if(logme){
        console.log("enter record");
        logme=false;
    }


    stream.write(convertFloat32ToInt16Buffer(inputBuffer[0]));
}

/**
 * new function ref: https://subvisual.co/blog/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
 * @param buffer
 * @returns {ArrayBuffer}
 */
function convertFloat32ToInt16(buffer) {
    l = buffer.length;
    buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l])*0x7FFF;
    }

    return buf.buffer;
}

function floatTo16BitPCM(output, offset, input){
    for (var i = 0; i < input.length; i++, offset+=2){
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function convertFloat32ToInt16Buffer(buffer){

    var l = buffer.length;  //Buffer
    var output = new Int16Array(l);
    var offset = 44;

    for (var i = 0; i < buffer.length; i++){
        var s = Math.max(-1, Math.min(1, buffer[i]));
        output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }

    return output.buffer;
}

/**
 * Tell server recording has completed
 */
function endRecording(){

    console.log("enter endRecording, socket status is: ");
    //ws.send('',{event : '--end-recording--'});
    stream.end();
    killTime=Date.now()+10000;
    console.log("sent end command, killTime: " + killTime);

    this.postMessage({command: 'waitForWebSocketResponse'});
};

/**
 * Wait for server response with song info after ending the recording
 */
var logwaitForWebSocketResponse=true;
function waitForWebSocketResponse(){

    if(logwaitForWebSocketResponse){
        console.log("enter waitForWebSocketResponse");
        logwaitForWebSocketResponse=false;
    }


    if(wsCompletedResponseReceived){
        console.log(JSON.stringify(responseDto));
        this.postMessage(responseDto);
    }
    else if(Date.now() > killTime){
        responseDto = {};
        responseDto.status='ERROR';
        responseDto.message ='We are sorry but our system is being very slow for some reason';
        this.postMessage(responseDto);
    }
    else{
        this.postMessage({command: 'waitForWebSocketResponse'});
    }

};

/**
 * make sure you have an open connection before recording
 */
function waitForConnection(){


    this.postMessage({command: 'hasConnection'});
    return;
    //TODO figure this out for BinaryJS
    if(ws.readyState != ws.OPEN){
        this.postMessage({command: 'waitForConnection'});
    }
    else{
        this.postMessage({command: 'hasConnection'});
    }

};