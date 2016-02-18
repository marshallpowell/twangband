var micWorker,
    sampleRate,
    numChannels,
    ws,
    recordingDto,
    responseDto,
    wsCompletedResponseReceived = false,
    killTime,
    baseUrl;

micWorker = this;

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

    ws = new WebSocket('wss://'+baseUrl+'/ws/');

    ws.onmessage = function (event) {

        console.log("enter onmessage");
        console.log(event.data);
        responseDto = JSON.parse(event.data);
        wsCompletedResponseReceived = true;
        ws.close();

    };

    ws.onopen = function open(event) {
        console.log('---------------------------------------------------- connected');
        ws.send('--start-recording--', {mask: true});
        ws.send(JSON.stringify(recordingDto), {mask: true});
    };

    ws.onclose = function(event){
        console.log("enter onclose");
    };

    ws.onerror=function(event){
        console.log('error connecting: ' + event);
        micWorker.postMessage({command: 'errorConnecting'});
        return;
    };

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

    ws.binaryType = "arraybuffer";
    ws.send(convertFloat32ToInt16(inputBuffer[0]), {mask: true});
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

/**
 * Tell server recording has completed
 */
function endRecording(){

    console.log("enter endRecording, socket status is: "+ws.readyState);
    ws.send('--end-recording--', {mask: true});

    killTime=Date.now()+5000;
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

    if(ws.readyState != ws.OPEN){
        this.postMessage({command: 'waitForConnection'});
    }
    else{
        this.postMessage({command: 'hasConnection'});
    }
};