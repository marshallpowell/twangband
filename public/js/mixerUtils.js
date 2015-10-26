var MixerUtil = {};

MixerUtil.addCollaboratorToUi = function(userDto) {
    console.log("collaborator: " + JSON.stringify(userDto));
    var div = $('<div class="col-sm-2"></div>');
    var img = $('<img class="collaborator thumbnail">');
    img.attr('src', "/uploads/users/profile/"+userDto.profilePic);
    img.appendTo(div);
    div.append("<div style='display:inline'>"+userDto.firstName+"</div>");
    div.appendTo('#collaborators');
}

MixerUtil.toggleCollaboratorDialog = function (closeMe){

    if(closeMe){
        document.getElementById("searchUsers").style.display="none";
    }
    else if(document.getElementById("searchUsers").style.display=="block"){
        document.getElementById("searchUsers").style.display="none";
    }
    else{
        document.getElementById("searchUsers").style.display="block";
    }

}

MixerUtil.updateTrackLabel = function(value, index){

    document.getElementById("trackLabel"+index).innerHTML= value.substring(0,15) + "...";

};


var selectedTrackDtoForNewSong = null;
MixerUtil.selectTrackForNewSong = function(trackDto){

    selectedTrackDtoForNewSong = trackDto;
    toggleNotification($("#newSongFromTrack"));
};

MixerUtil.removeTrackFromSong = function(uiId){

    if(!confirm("Are you sure you want to remove this track")){
        return;
    }


    //find parent div and remove

    //remove from the currentSong array

    console.log("before currentSong tracks size: " + currentSong.tracks.length + " \n" + JSON.stringify(currentSong.tracks));

    for(var i =0; i < currentSong.tracks.length; i++){
        if(currentSong.tracks[i].uiId == uiId){
            console.log('removing track: ' + $("#"+uiId).html());
            document.getElementById(uiId).style.display='none';
            currentSong.removeTrack(i);
            break;
        }
    }

    console.log("after currentSong track size: " + currentSong.tracks.length + " \n" + JSON.stringify(currentSong.tracks));


};

MixerUtil.createNewSongFromTrack = function(){
    var newSongDto = new SongDto();
    newSongDto.name = document.getElementById('newSongName').value;
    newSongDto.description = document.getElementById('newSongDescription').value;
    newSongDto.tracks.push(selectedTrackDtoForNewSong);

    var formData = new FormData();
    formData.append("song", JSON.stringify(newSongDto));

    $('#notificationBody').html("Saving...");
    $('#myModal').modal('toggle');

    $.ajax({
        url: '/song/save',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        type: 'POST',
        success: function(data){

            //TODO need to handle errors too
            console.log("saved song: " + data);

            $('#notificationBody').html("Saved Successfully. Refreshing Page");
            $('#myModal').modal('toggle');

            window.location.href="/mixer?song="+data.id;

        },
        fail: function(data){
            alert('error');
        }
    });

}

MixerUtil.validateAndNotify = function(el, role){

    if(!user){
        $(el).notify('You must login first', 'info');
        return false;
    }

    if(role == AppConstants.ROLES.ADMIN){
        if(!SongValidation.isAdmin(user, songDto)){
            $(el).notify('You must be an admin to perform this action', 'info');
            return false;
        }
    }

    if(role == AppConstants.ROLES.ADD_TRACK){
        if(!SongValidation.canAddTrack(user, songDto)){
            $(el).notify('You must be collaborator to perform this action', 'info');
            return false;
        }
    }

    return true;
}

MixerUtil.isLoggedIn = function(el){

    if(user){
        return true;
    }

    $(el).notify('You must login first', 'info');
    return false;
};

function searchCollaborators(){

    if(!MixerUtil.isLoggedIn(document.getElementById("bcollaborators"))){
        return;
    }

    var formData = new FormData();
    var searchDto = {
        type : "USER",
        firstName : document.getElementById("searchFirstName").value,
        lastName : document.getElementById("searchLastName").value,
        email : document.getElementById("searchEmail").value
    };

    formData.append("searchCriteria", JSON.stringify(searchDto));


    $.ajax({
        url: '/search',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        type: 'POST',
        success: function(data){
            console.log(data);
            //display search results
            var output="<ul>";

            $( data ).each(function( index ) {

                output += "<li><a href='#' onclick='addCollaborator("+JSON.stringify(this)+");' >" + this.firstName + " " + this.lastName + "</a></li>";
            });

            output += "</ul>";

            document.getElementById("searchUsersData").innerHTML=output;
        }
    });
}

function addCollaborator(userDto){

    console.log("add userDto: " + userDto);
    var formData = new FormData();
    var collaboratorDto = {
        'id' : userDto.id,
        'roles' : ['ADD_TRACK'],
        'invitationAccepted' : false
    };

    currentSongDto.collaborators.push(collaboratorDto);
    MixerUtil.addCollaboratorToUi(userDto);

}

/**
 * Draws the track data on the canvas. (Not used anywhere at the moment)
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


function toggleEditTrack(trackNumber){

    toggleNotification($('#trackInfo'+trackNumber));
}

function toggleNotification(content, doNotToggle){

    var el = $("#notificationBody").children().first();

    if(content == null){
        $("#notificationBody").children().first().replaceWith("").appendTo($('#trash'));
    }
    else if(content.attr('id') != el.attr('id')){
        $("#notificationBody").children().first().replaceWith(content).appendTo($('#trash'));
    }

    if(!doNotToggle){
        $('#myModal').modal('toggle');
    }

}
function toggleEditSong(closeMe){

    toggleNotification($('#songInfo'));

}

function toggleSearchUsers(closeMe){

    if(!SongValidation.isAdmin(user, songDto)){
        document.getElementById('searchUsersForm').style.display='none';
    }
    toggleNotification($('#searchUsers'));
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

    audioRecorder.exportWAVBufferArray( doneEncoding );
}


/**
 * Called after the recording has completed and data has been encoded
 * @param arrayBuffer
 */
function doneEncoding( arrayBuffer ) {

    //console.log("doneEncoding " + Object.prototype.toString.call(arrayBuffer) + " length: " + arrayBuffer.length);

    if(confirm("Do you want to keep this recording?")){

        //had to put this into a delay for modal to work properly
        setTimeout(function() {
            var track = new LocalTrack("localTrack");
            addNewTrackToSong(track, currentSong.tracks.length, arrayBuffer);
        },1000);
    }

}




var isRecordingOn = false;
//TODO implement better browser detection logic
var keyEventElement = (window.navigator.userAgent.indexOf("Firefox") > -1) ? document.body : '#myModal';
function toggleRecording(){

    if(isRecordingOn){
        //stop recording and close dialog
        isRecordingOn=false;

        document.getElementById("recordingWav").style.display="none";
        $('#myModal').modal('toggle');
        document.getElementById("modalCloseBtn").style.display="inline";
        document.getElementById("modalXCloseBtn").style.display="inline";
        $(keyEventElement).off('keypress', toggleRecording);
        //stop the equalizer
        cancelAnalyserUpdates();
        // stop recording
        audioRecorder.stop();
        audioRecorder.getBuffer( gotBuffers );


    }
    else{
        if (!audioRecorder){
            $.notify("There was an error attempting to record. Please ensure your browser settings allow us to access your mic.", "error");
            return;
        }

        //start recording
        isRecordingOn=true;
        //start the equalizer
        var startRecording = 6;
        var div = document.getElementById("timer");
        //div.style.display="block";
        document.getElementById("recordingWav").style.display="block";
        document.getElementById("modalCloseBtn").style.display="none";
        document.getElementById("modalXCloseBtn").style.display="none";
        $('#myModal').modal('toggle');
        toggleNotification(null, true);
        setInterval(function(){

            if(--startRecording > 0){

                if(startRecording == 1){
                    playAllTracks(0);
                    div.innerHTML = "PLAY!";

                    // start recording

                    updateAnalysers();
                    //e.classList.add("recording");
                    //  e.classList.add("fa-spin")
                    audioRecorder.clear();
                    audioRecorder.record();
                    clearInterval();
                    //div.style.display="none";
                    div.innerHTML="Press the space bar to stop recording";

                    //document.addEventListener("keydown", toggleRecording);
                    $(keyEventElement).on('keypress',toggleRecording);

                }
                else{
                    div.innerHTML = "Start playing in " + startRecording + "...";
                }
                $('#notificationBody').html($('#recordingDialog').html());


                //startRecording--;
            }
            else{
                clearInterval();
            }

        },1000);



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

    toggleRecording(document.getElementById('brecordMix'));

}

var AUDIO_INITIALIZED=false;
function initAudio() {

    if(AUDIO_INITIALIZED){
        return;
    }

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
            }
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });

    AUDIO_INITIALIZED=true;
}




//window.addEventListener('load', initAudio );
