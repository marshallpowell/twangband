var recLength = 0,
  recBuffers = [],
  sampleRate,
  numChannels,
  ws,
  recordingDto,
  responseDto,
  wsCompletedResponseReceived = false,
  killTime;

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.config);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
    case 'exportWAVArrayBuffer':
        exportWAVArrayBuffer(e.data.type);
      break;
    case 'exportWavFromBuffers':
      exportWavFromBuffers(e.data.type, e.data.buffers, e.data.totalLength);
      break;
    case 'endRecording':
      endRecording();
      break;
    case 'getWebSocketResponse':
      getWebSocketResponse();
      break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
  numChannels = config.numChannels;
  recordingDto = config.recordingDto;

  initBuffers();
  createWs();
}

function createWs(){

  ws = new WebSocket('ws://localhost:3001');

  ws.onmessage = function (event) {

    console.log(event.data);

    responseDto = JSON.parse(event.data);

    wsCompletedResponseReceived = true;
    ws.close();
  };

  ws.onopen = function open() {
    console.log('connected');
    ws.send('--start-recording--', {mask: true});
    ws.send(JSON.stringify(recordingDto), {mask: true});
  };

}

function record(inputBuffer){
  for (var channel = 0; channel < numChannels; channel++){
    recBuffers[channel].push(inputBuffer[channel]);
  }
  recLength += inputBuffer[0].length;

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
 *
 * @param type
 * @param buffers - array of buffers
 */
function exportWavFromBuffers(type, buffers, totalLength){

  console.log("enter exporWavFromBuffers");
  var float32Array = mergeBuffers(buffers, totalLength);
  var dataview = encodeWAV(float32Array);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}

function endRecording(){

  ws.send('--end-recording--', {mask: true});

  killTime=Date.now()+5000;
  var timedOut=false;
  console.log("sent end command, killTime: " + killTime);

  this.postMessage({command: 'getWebSocketResponse'});
}
/**
 * New function which waits on the sockets response and returns it.
 */
function getWebSocketResponse(){

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
    this.postMessage({command: 'getWebSocketResponse'});
  }


}
/**
 * New function which returns an ArrayBuffer after encoding
 * @param type
 */
function exportWAVArrayBuffer(type) {

    console.log("exportWavArrayBuffer");
    var buffers = [];
    for (var channel = 0; channel < numChannels; channel++){
        buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    if (numChannels === 2){
        var interleaved = interleave(buffers[0], buffers[1]);
    } else {
        var interleaved = buffers[0];
    }
    var dataview = encodeWAV(interleaved);
    console.log("exportWavArrayBuffer complete, returning " + Object.prototype.toString.call(dataview.buffer));

    this.postMessage(dataview.buffer);
}

function exportWAV(type){
  var buffers = [];
  for (var channel = 0; channel < numChannels; channel++){
    buffers.push(mergeBuffers(recBuffers[channel], recLength));
  }
  if (numChannels === 2){
      var interleaved = interleave(buffers[0], buffers[1]);
  } else {
      var interleaved = buffers[0];
  }
  var dataview = encodeWAV(interleaved);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}

function getBuffer(){
  var buffers = [];
  for (var channel = 0; channel < numChannels; channel++){
    buffers.push(mergeBuffers(recBuffers[channel], recLength));
  }
  this.postMessage(buffers);
}

function clear(){
  recLength = 0;
  recBuffers = [];
  initBuffers();
}

function initBuffers(){
  for (var channel = 0; channel < numChannels; channel++){
    recBuffers[channel] = [];
  }
}

function mergeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){

    console.log("enter encodeWAV: " + Object.prototype.toString.call(samples));
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
