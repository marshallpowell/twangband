/**
 * Draws the track data on the canvas.
 * @param track
 */
function drawBuffer(track) {

    // var canvas = $('#wavedisplay').clone();
    var infoColumn = $('<div class=".col-xs-6 .col-sm-4 ">Track</div>');
    var wavColumn = $('<div class=".col-xs-12 .col-sm-6 .col-lg-8"></div>');
    var canvas = $('<canvas width="1024" height="100"></canvas>');
    canvas[0].id = track.id;
    var width = canvas[0].width;
    var height = canvas[0].height;
    var context = canvas[0].getContext('2d');

    var step = Math.ceil( track.data.length / width );
    var amp = height / 2;
    context.fillStyle = "silver";
    context.clearRect(0,0,width,height);

    for(var i=0; i < width; i++){
        var min = 1.0;
        var max = -1.0;
        for (j=0; j<step; j++) {
            var datum = track.data[(i*step)+j];
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }
        context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
    }

    canvas.appendTo(wavColumn);
    infoColumn.appendTo("#viz");
    wavColumn.appendTo("#viz");
    // canvas.appendTo("#viz");
}


var recordings=[];
var track = undefined;
/**
 *
 * @param id
 * @param data - Float32Array
 * @constructor
 */
function UiTrack(id, data){

    this.id = 'local_'+id;
    this.data = data;
    this.format = 'wav';

    this.onloaderror = function(){
        console.log("load error");
    }

    this.src = 'local_'+id;
}


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

var audioContext = new AudioContext();
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

    Tools.debug("buffers[0].buffer is a  " + Object.prototype.toString.call(buffers[0].buffer));
    track = new UiTrack(recIndex++, buffers[0]);

    /* MP - performed now in "doneEncoding"
     var canvas = document.getElementById( "wavedisplay" );
     drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );
     */

    // the ONLY time gotBuffers is called is right after a new recording is completed -
    // so here's where we should set up the download.
    ///// original called exportWAV and doneEncoding arg was a blob.
    audioRecorder.exportWAVBufferArray( doneEncoding );
}


/**
 * Called after the recording has completed and data has been encoded
 * @param arrayBuffer
 */
function doneEncoding( arrayBuffer ) {

    console.log("doneEncoding " + Object.prototype.toString.call(arrayBuffer) + " length: " + arrayBuffer.length);

    var track = new LocalTrack("localTrack");

    //currentSong.tracks.push(track);
    addNewTrackToSong(track, currentSong.tracks.length, arrayBuffer);


}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {

        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        // e.classList.remove("fa-spin");
        audioRecorder.getBuffer( gotBuffers );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        //  e.classList.add("fa-spin")
        audioRecorder.clear();
        audioRecorder.record();
    }
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

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

window.addEventListener('load', initAudio );
