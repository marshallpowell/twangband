var recordings=[];


/* Copyright 2013 Chris Wilson

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 Please note this sources has been heavily modified from its original form and is not intended for redistribution. Use at your own risk.
 */


window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = tb.audioContext; //new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

/* TODO:

 - offer mono option
 - "Monitor input" switch
 */

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}
function gotBuffers( buffers ) {

    audioRecorder.endRecording(finishedProcessing);
    //audioRecorder.exportWAVBufferArray( doneEncoding );
}

/**
 * Called after recording has completed and song has finished processing on the server
 * @param responseDto
 */
function finishedProcessing(responseDto){

    setTimeout(function() {
        console.log('finishedProcessing, adding new track: ' + JSON.stringify(responseDto));
        mixer.addNewTrack(responseDto.track);
    },1000);
}
/**
 * Called after the recording has completed and data has been encoded
 * @param arrayBuffer
 */
function doneEncoding( arrayBuffer ) {

        //had to put this into a delay for modal to work properly
        setTimeout(function() {
            mixer.addNewRecording(new Blob([arrayBuffer], {type: "audio/wav"}));
        },1000);

}
function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}
function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}
function updateAnalysers(time) {

    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData);

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }

    rafID = window.requestAnimationFrame( updateAnalysers );
}
function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}
function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    MixerUtil.recordingDto = new RecordingDto(user.id, songDto.id, MixerUtil.latencyTime);
    audioRecorder = new Recorder( inputPoint, {bufferLen : 4096, recordingDto : MixerUtil.recordingDto});

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );


}

function waitForWsConnection(){

    if(audioRecorder.hasConnection()){
        console.log("open toggleRecording");
        MixerUtil.toggleRecording();
    }
    else if(Date.now() > wsWaitTimeOut){
        alert("error connectiong to server");
        return;
    }
    else{
        audioRecorder.waitForConnection();

        setTimeout(waitForWsConnection, 500);
    }
}

var AUDIO_INITIALIZED=false;
var wsWaitTimeOut;
if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
if (!navigator.cancelAnimationFrame)
    navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
if (!navigator.requestAnimationFrame)
    navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

function initAudio() {

    console.log("enter initAudio....");
    MixerUtil.latencyTime=MixerUtil.getCookie('systemLatency');

    if(MixerUtil.isRecordingOn){
        console.log('MixerUtil.isRecordingOn: ' + MixerUtil.isRecordingOn);
        MixerUtil.toggleRecording();
        return;
    }
    else if(MixerUtil.latencyTime == null || MixerUtil.latencyTime.length==0){
        MixerUtil.toggleCallibrateDialog();
        return;
    }
    //getUserMedia options...
    //http://stackoverflow.com/questions/26485049/how-can-i-disable-automatic-gain-control-agc-in-webrtc-web-apps-such-as-google
    //https://groups.google.com/forum/#!topic/discuss-webrtc/L4AzllUOTBM
    else if(!AUDIO_INITIALIZED){
        navigator.getUserMedia(
            {
                "audio": {
                    optional: [
                        {googAutoGainControl: false},
                        {googAutoGainControl2: false},
                        {googEchoCancellation: false},
                        {googEchoCancellation2: false},
                        {googNoiseSuppression: false},
                        {googNoiseSuppression2: false},
                        {googHighpassFilter: false},
                        {googTypingNoiseDetection: false},
                        {googAudioMirroring: false}
                    ]
                },
            }, gotStream, function(e) {
                alert('Error getting audio');
                console.log(e);
            });

        AUDIO_INITIALIZED=true;

        setTimeout(function(){
            var wsWaitTimeOut=Date.now()+5000;
            waitForWsConnection()

        },1000);
    }
    else{
        console.log("again createn new audioRecorder......");
        audioRecorder = new Recorder( inputPoint, {bufferLen : 4096, recordingDto : MixerUtil.recordingDto});
        waitForWsConnection()
    }


}

