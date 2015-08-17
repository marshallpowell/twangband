// Amine Hallili
//hooking the interface object to the window
window.View = new View();

var bufferLoader;

// The current song
var currentSong;

// The audio context
var context;

var buttonPlay, buttonStop, buttonPause, buttonRecordMix;
// List of tracks and mute buttons
var divTrack;
//The div where we display messages
var divConsole;

// Object that draws a sample waveform in a canvas
var waveformDrawer;

// zone selected for loop
var selectionForLoop = {
    xStart: -1,
    xEnd: -1
};

var DURRATION_BUFFER = (window.navigator.userAgent.indexOf("Firefox") > -1)? 49.5 : 56.8;
// Sample size in pixels
var SAMPLE_HEIGHT = 75;

// Useful for memorizing when we paused the song
var lastTime = 0;
var currentTime;
var delta;
// The x position in pixels of the timeline
var currentXTimeline=0;
var cummulativeXTimeline=0;

var tracksTopRow = $("#tracksTop");

// requestAnim shim layer by Paul Irish, like that canvas animation works
// in all browsers
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function ( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var currentSongDto;

function init(songDto) {

    View.init();

    // Get handles on buttons
    buttonPlay = document.querySelector("#bplay");
    buttonPause = document.querySelector("#bpause");
    buttonStop = document.querySelector("#bstop");
    buttonRecordMix = document.querySelector("#brecordMix");

    buttonRecordMix.disabled=false;

   // divTrack = document.getElementById("tracks");
    divConsole = document.querySelector("#messages");

    // The waveform drawer
    waveformDrawer = new WaveformDrawer();

    View.frontCanvas.addEventListener("mouseup", function (event) {
        if (!existsSelection()) {
            console.log("mouse click on canvas, let's jump to another position in the song");
            var mousePos = getMousePos(window.View.frontCanvas, event);
            // will compute time from mouse pos and start playing from there...
            jumpTo(mousePos.x);
        }
    });

    // Mouse listeners for loop selection
    initLoopABListeners();

    // Master volume slider
    masterVolumeSlider = $('.knob').val();

    // Init audio context
    context = initAudioContext();



    // Get the list of the songs available on the server and build a
    // drop down menu
    //old code loadSongList();

    animateTime();

    currentSong  = new Song("", context);

    bufferLoader = new BufferLoader(
        context,
        [],
        finishedLoading,
        drawTrack
    );
    console.log("check songDto: " + songDto);
    if(songDto != null){

        currentSongDto = songDto;
        console.log("new song loaded, name: " + songDto.name);

        loadSongDto(songDto);

        View.waveCanvas.width = getMaxTrackWidth();
    }
    else{
        console.log("check songDto in NULL");
        currentSongDto = new SongDto();
    }
}

function log(message) {
    // Be sure that the console is visible
    View.activeConsoleTab();
    $('#messages').append(message + "<br/>");
    $('#messages').animate({
        scrollTop: $('#messages').prop("scrollHeight")
    }, 500);
}

function clearLog() {
    $('#messages').empty();
}

function existsSelection() {

    return ((selectionForLoop.xStart !== -1) && (selectionForLoop.xEnd !== -1));
}

function loopOnOff() {
    currentSong.toggleLoopMode();
    $("#loopOnOff").toggleClass("activated");
    console.log("LoopMode : " + currentSong.loopMode);
}

function setLoopStart() {
    if (!currentSong.paused) {
        selectionForLoop.xStart = currentXTimeline;
        // Switch xStart and xEnd if necessary, compute width of selection
        adjustSelectionMarkers();
    }
}

function setLoopEnd() {
    if (!currentSong.paused) {
        selectionForLoop.xEnd = currentXTimeline;
        // Switch xStart and xEnd if necessary, compute width of selection
        adjustSelectionMarkers();
    }
}

function resetSelection() {
    selectionForLoop = {
        xStart: -1,
        xEnd: -1
    };
}

function initLoopABListeners() {
    // For loop A/B selection
    $("#" + View.frontCanvas.id).mousedown(function (event) {
        resetSelection();
        var previousMousePos = getMousePos(window.View.frontCanvas, event);
        selectionForLoop.xStart = previousMousePos.x;

        $("#" + View.frontCanvas.id).bind("mousemove", previousMousePos, function (event) {
            // calculate move angle minus the angle onclick
            var mousePos = getMousePos(window.View.frontCanvas, event);

            //console.log("mousedrag from (" + previousMousePos.x + ", " + previousMousePos.y + ") to ("
            //    + mousePos.x + ", " + mousePos.y +")");
            selectionForLoop.xEnd = mousePos.x;

            // Switch xStart and xEnd if necessary, compute width of selection
            adjustSelectionMarkers();
        });
    });

    /**
     * Remove listener when mouseup
     */
    $("#" + View.frontCanvas.id).mouseup(function () {
        $("#" + View.frontCanvas.id).unbind("mousemove");

    });
}

function adjustSelectionMarkers() {
    if (existsSelection()) {
        // Adjust the different values of the selection
        var selectionWidth = Math.abs(selectionForLoop.xEnd - selectionForLoop.xStart);
        var start = Math.min(selectionForLoop.xStart, selectionForLoop.xEnd);
        var end = Math.max(selectionForLoop.xStart, selectionForLoop.xEnd);
        selectionForLoop = {
            xStart: start,
            xEnd: end,
            width: selectionWidth
        };
    }
}

function initAudioContext() {
        // Initialise the Audio Context
        // There can be only one!
        var context;

        if (typeof AudioContext == "function") {
            context = new AudioContext();
            console.log("USING STANDARD WEB AUDIO API");
        } else if ((typeof webkitAudioContext == "function") || (typeof webkitAudioContext == "object")) {
            context = new webkitAudioContext();
            console.log("USING WEBKIT AUDIO API");
        } else {
            throw new Error('AudioContext is not supported. :(');
        }
        return context;
    }
    // SOUNDS AUDIO ETC.


function resetAllBeforeLoadingANewSong() {
    console.log('resetAllBeforeLoadingANewSong');

    // Stop the song
    stopAllTracks();

    buttonPlay.disabled = true;
   // buttonRecordMix.disabled = true;
}

/**
 * loads the songs tracks into audio buffers for playback
 */
function loadTracksForPlayback(trackUrls) {
    bufferLoader = new BufferLoader(
        context,
        trackUrls,
        finishedLoading,
        drawTrack
    );
    bufferLoader.load();
}

var maxWidth=0;
/**
 * Draws the image of the sound
 * @param decodedBuffer
 * @param trackNumber
 */
function drawTrack(decodedBuffer, trackNumber, newMaxWidth) {

    console.log("drawTrack : let's draw sample waveform for track No" + trackNumber + ", TRACK INFO " + JSON.stringify(currentSong.tracks[trackNumber]));


    var trackName = currentSong.tracks[trackNumber].name;
    //trackName = trackName.slice(trackName.lastIndexOf("/")+1, trackName.length-4);

    //new code
    var trackCanvas = document.getElementById("track_canvas_"+trackNumber);

    if(maxWidth < decodedBuffer.duration * DURRATION_BUFFER){
        maxWidth = decodedBuffer.duration * DURRATION_BUFFER
    }
    trackCanvas.width = (newMaxWidth)? newMaxWidth : maxWidth;
    trackCanvas.width += $('#myCanvas').width();
    var trackCanvasContext = trackCanvas.getContext('2d');
    waveformDrawer.init(decodedBuffer, trackCanvas, '#83E83E',DURRATION_BUFFER);
    var x = 0;
    var y = 0;
    waveformDrawer.drawWave(y, SAMPLE_HEIGHT);

   // trackCanvasContext.strokeStyle = "white";
   // trackCanvasContext.strokeRect(x, y, trackCanvas.width, trackCanvas.height);

    trackCanvasContext.font = '14pt Arial';
    trackCanvasContext.fillStyle = 'grey';
    trackCanvasContext.fillText(trackName, x + 10, y + 20);

    //return;
    //end new code

}

function finishedLoading(bufferList) {
    log("Finished loading all tracks, press Start button above!");

    // set the decoded buffer in the song object
    currentSong.setDecodedAudioBuffers(bufferList);

    buttonPlay.disabled = false;
    buttonRecordMix.disabled = false;

    //enabling the loop buttons
    $('#loopBox > button').each(function (key, item) {
        item.disabled = false;
    });

    // enable all mute/solo buttons
    $(".mute").attr("disabled", false);
    $(".solo").attr("disabled", false);

    // enable song select menu
   //var s = document.querySelector("#songSelect");
   // s.disabled = false;

    // Set each track volume slider to max
    for (i = 0; i < currentSong.getNbTracks(); i++) {
        // set volume gain of track i to max (1)
        //currentSong.setVolumeOfTrack(1, i);
        $(".volumeSlider").each(function (obj, value) {
            obj.value = 100;
        });
    }
}



// ##### TRACKS #####

function loadSongDto(songDto) {
    resetAllBeforeLoadingANewSong();

    // This function builds the current
    // song and resets all states to default (zero muted and zero solo lists, all
    // volumes set to 1, start at 0 second, etc.)
    currentSong = new Song(songDto.name, context);

    resizeSampleCanvas(songDto.tracks.length);

    // for eah instrument/track in the song
    var trackUrls = [];
    songDto.tracks.forEach(function (trackDto, trackNumber) {
        // Let's add a new track to the current song for this instrument
        //currentSong.addTrack(instrument);
        var track = new Track(trackDto.name, trackDto);
        track.fileName = trackDto.fileName;
        // Render HTMl
        addNewTrackToSong(track, trackNumber);
        trackUrls.push("/uploads/"+trackDto.fileName);

    });

    //add the collaboarators to the UI
    for(var i = 0; i < songDto.collaborators; i++){
        //TODO
    }

    // Add range listeners, from range-input.js
    addRangeListeners();

    // disable all mute/solo buttons
    $(".mute").attr("disabled", true);
    $(".solo").attr("disabled", true);

    // Loads all samples for the currentSong
    loadTracksForPlayback(trackUrls);


}


/**
 * Create a SongDTO from a song
 * @returns {SongDto}
 */
function getSongFormData(){

    var formData = new FormData();

    currentSongDto.name = $("#songName").val();
    currentSongDto.description = $("#songDescription").val();
    currentSongDto.tracks = [];


    //if the track is newly recorded add the blob data
    $.each(currentSong.tracks, function(index, track){
        var trackDto = getTrackDto(track);
        trackDto.viewOrder = index;
        trackDto.name = document.getElementById('trackName'+index).value;
        trackDto.description = document.getElementById('trackDescription'+index).value;

        console.log("tracks description: " + trackDto.description);
        currentSongDto.tracks.push(trackDto);
        if(track.blob != undefined){
            console.log("adding rack blobData: " + track.blob + " for index: " + index);
            formData.append("newTrack_"+index, track.blob, "song.wav");
        }
    });

    formData.append("song", JSON.stringify(currentSongDto));

    return formData;
}

/**
 * Map a track object to TrackDTO
 * @param track
 * @returns {TrackDto}
 */
function getTrackDto(track){

    var trackDto = new TrackDto();

    trackDto.fileName = track.fileName;
    trackDto.blobData = track.blob;
    trackDto.id = track.id;
    trackDto.peaks = track.peaks;
    trackDto.volume = track.volume;
    trackDto.panning = track.panning;
    trackDto.muted = track.muted;
    trackDto.solo = track.solo;
    trackDto.creatorId = track.creatorId;
    return trackDto;
}

/**
 * persist a song
 */
function saveSong(){

    if(!MixerUtil.isLoggedIn(document.getElementById("bsaveSong"))){
        return;
    }
    var data = getSongFormData();

    console.log("saveTrack: , song: " + $('#songName').val() + " with desc: " + $('#songDescription').val() + " and tracks: " + JSON.stringify(data));

    $('#notificationBody').html("Saving...");
    $('#myModal').modal('toggle');

    $.ajax({
        url: '/song/save',
        data: data,
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

        }
    });
}
/**
 *
 * @param track
 * @param trackNumber
 * @param arrayBuffer optional, used for newly recorded track
 */
function addNewTrackToSong(track, trackNumber, arrayBuffer){
    console.log("enter addnewTrackToSong");

    // Let's add a new track to the current song for this instrument
    currentSong.tracks.push(track);

    // resize canvas depending on number of samples
    resizeSampleCanvas(currentSong.tracks.length);

    var canvas = $('<canvas width="'+window.View.masterCanvas.width+'" height="'+SAMPLE_HEIGHT+'" class="trackCanvas"></canvas>');

    canvas[0].id = "track_canvas_"+trackNumber;
    var width = canvas[0].width;
    var height = canvas[0].height;
    var context = canvas[0].getContext('2d');

    //decode newly recorded track
    if(arrayBuffer != null) {

        track.blob = new Blob([arrayBuffer], { type: track.type });
        console.log("newly recorded track being added");

    }

    console.log("track dto: " + JSON.stringify(currentSongDto.tracks[trackNumber]));
    var creatorImage = "<img src='/uploads/users/profile/shadow.jpg' width='50' height='50' />";
    if(currentSongDto.tracks[trackNumber] && currentSongDto.tracks[trackNumber].creatorId){
        console.log("creating creatorImage");
         creatorImage = "<img src='/uploads/users/profile/"+currentSongDto.tracks[trackNumber].creatorId+".jpg' width='50' height='50' />&nbsp;";
    }

    var trackInfo = "<div class='col-md-2'>" +
    "<div class='row'>"+ creatorImage +
    "<button class='mute' id='mute" + trackNumber + "' onclick='muteUnmuteTrack(" + trackNumber + ");'><span class='glyphicon glyphicon-volume-up'></span></button> " +
    "<button class='solo' id='solo" + trackNumber + "' onclick='soloNosoloTrack(" + trackNumber + ");'><span class='glyphicon glyphicon-headphones'></span></button>" +
    "</div>" +
    "<div class='row'>" +
    "<a href='#' onclick='toggleEditTrack("+trackNumber+");' ><span id='trackLabelIcon" + trackNumber + "' class='glyphicon glyphicon-pencil'></span><span id='trackLabel"+ trackNumber +"'>" +track.name.substring(0,15) + "...</span></a>" +

        "<div style='display:none'>" +
        " <div id='trackInfo"+trackNumber+"'> " +
        "    <div class='form-group row'> " +
        "        <div class='col-sm-4'><label for='trackName"+ trackNumber+"'>Track Name</label></div> " +
        "        <div class='col-sm-8'><input type='text' class='form-control' id='trackName" + trackNumber + "' class='trackName' value='" +track.name + "' name='trackName" + trackNumber + "' placeholder='Enter a name for this track' onchange='MixerUtil.updateTrackLabel(this.value,"+trackNumber+");'/></div> " +
        "        <div class='col-sm-4'><label for='trackName'>Description</label></div> " +
        "        <div class='col-sm-8'><textarea class='form-control' id='trackDescription" + trackNumber + "' ng-model='trackDescription" + trackNumber + "' placeholder='Enter a description for this track'></textarea></div> " +
        "    </div> " +
        "  </div> " +
        "</div> " +
        "<span id='volspan'><input type='range' class = 'volumeSlider' id='volume" + trackNumber + "' min='0' max = '100' value='100' style='width:150px' oninput='setVolumeOfTrackDependingOnSliderValue(" + trackNumber + ");'/></span>" +
    "</div>" +
    "</div>";


    var trackCanvas = document.createElement('div');
    trackCanvas.className="col-md-10 trackData";
    trackCanvas.id="trackData"+trackNumber;
    trackCanvas.style.overflowX="scroll";
    trackCanvas.appendChild(canvas[0]);

    var trackRow =  document.createElement('div');
    trackRow.className="row trackRow";
    trackRow.style.backgroundColor="#9999";
    trackRow.innerHTML = trackInfo + trackCanvas.outerHTML;
    $("#scroll").append(trackRow);


    //places the track cursor at the top left of the track (needs it's with adjusted to the max duration of a track)
    $("#frontCanvas").css({
        top: tracksTopRow.offset().top + "px",
        left: tracksTopRow.offset().left + "px",
        position: 'absolute'
    });


    if(arrayBuffer){
        bufferLoader.loadBuffer(null, trackNumber, arrayBuffer);
    }

    //increase width of tracks to max width
    updateTracksWidth();
}

function getMousePos(canvas, evt) {
    // get canvas position
    var obj = canvas;
    var top = 0;
    var left = 0;

    while (obj && obj.tagName != 'BODY') {
        top += obj.offsetTop;
        left += obj.offsetLeft;
        obj = obj.offsetParent;
    }
    // return relative mouse position
    var mouseX = evt.clientX - left + window.pageXOffset;
    var mouseY = evt.clientY - top + window.pageYOffset;
    return {
        x: mouseX,
        y: mouseY
    };
}

// Michel Buffa : x is in pixels, should be in seconds, and this function should
// be moved into song.js, and elapsedTimeSinceStart be an attribute...
function jumpTo(x) {
    // is there a song loaded ?
    if (currentSong === undefined) return;

    //console.log("in jumpTo x = " + x);
    // width - totalTime
    // x - ?
    stopAllTracks();
    var totalTime = currentSong.getDuration();
    var startTime = (x * totalTime) / window.View.frontCanvas.width;
    currentSong.elapsedTimeSinceStart = startTime;

    playAllTracks(startTime);
}

// A better function for displaying float numbers with a given number
// of digits after the int part
function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

function getMaxTrackWidth(){
    if(currentSong === undefined){
        return 0;
    }

    return (currentSong.getDuration() * 50);
}

function updateTracksWidth(){


    $(".trackCanvas").each(function() {
        console.log("canvasId: " + $(this)[0].id + " $(this)[0].width: " + $(this)[0].width + " maxWidth: " + maxWidth);
        if($(this)[0].width < maxWidth){
            console.log("canvasId 2: " + $(this)[0].id);
            var index = $(this)[0].id.replace("track_canvas_", "");
            drawTrack(currentSong.tracks[index].decodedBuffer, index);
        }

        var c = $(this)[0];
        var ctx = c.getContext("2d");
        ctx.moveTo(maxWidth,100);
        ctx.lineTo(maxWidth,0);
        ctx.stroke();
    });
}



function animateTime() {
    // clear canvas
    View.frontCanvasContext.clearRect(0, 0, window.View.masterCanvas.width, window.View.masterCanvas.height);

    // Draw something only if a song has been loaded
    if (currentSong !== undefined) {


        // Draw selection for loop
        drawSelection();

        if (!currentSong.paused) {

                  // Draw the time on the front canvas
            currentTime = context.currentTime;
            var delta = currentTime - lastTime;


            var totalTime;

            View.frontCanvasContext.fillStyle = 'grey';
            View.frontCanvasContext.font = '14pt Arial';
            //View.frontCanvasContext.fillText(toFixed(currentSong.elapsedTimeSinceStart, 1) + "s", 180, 20);
            View.frontCanvasContext.fillText((currentSong.elapsedTimeSinceStart + "").toFormattedTime() + "s", 400, 20);
            //console.log("dans animate");

            // at least one track has been loaded
            if (currentSong.decodedAudioBuffers[0] !== undefined) {

                totalTime = currentSong.getDuration();

                var el = $(".trackData");

                console.log("element length: " + el.length);

                var adjustXTimeline=0;
                var adjust=false;
                //if cursor position = el[0].scrollLeft + el.width() then

                if((currentXTimeline >= el.width())){
                    var maxScrollLeft = maxWidth; // - el[0].clientWidth;
                    cummulativeXTimeline+=currentXTimeline;
                   var scrollTo = (cummulativeXTimeline > maxScrollLeft) ? maxScrollLeft : cummulativeXTimeline;


                    el.scrollLeft(scrollTo);
                    adjustXTimeline=el.width();
                    adjust=true;
                    currentXTimeline = 0;
                }
                //currentXTimeline = ((currentSong.elapsedTimeSinceStart * maxWidth / totalTime) - (el[0].scrollLeft) - adjustXTimeline);
                //currentXTimeline = (currentXTimeline < 0 )? el.position().left : currentXTimeline;
                currentXTimeline += 1;
                // draw frequencies that dance with the music
                drawFrequencies();

                // Draw time bar
                View.frontCanvasContext.strokeStyle = "grey";
                View.frontCanvasContext.lineWidth = 2;
                View.frontCanvasContext.beginPath();
                View.frontCanvasContext.moveTo(currentXTimeline, 0);
                View.frontCanvasContext.lineTo(currentXTimeline, window.View.masterCanvas.height);
                View.frontCanvasContext.stroke();

                currentSong.elapsedTimeSinceStart += delta;
                lastTime = currentTime;

                if (currentSong.loopMode) {
                    // Did we reach the end of the loop
                    if (existsSelection()) {
                        if (currentXTimeline > selectionForLoop.xEnd) {
                            jumpTo(selectionForLoop.xStart);
                        }
                    }
                }

                // Did we reach the end of the song ?
                if (currentSong.elapsedTimeSinceStart > currentSong.getDuration()) {
                    // Clear the console log and display it
                    clearLog();
                    log("Song's finished, press Start again,");
                    log("or click in the middle of the song,");
                    log("or load another song...");

                    // Stop the current song
                    stopAllTracks();
                }
            }
        }
    } else {
        showWelcomeMessage();
    }
    requestAnimFrame(animateTime);
}

function showWelcomeMessage() {
   // console.log("TODO some type of instructional logic here");
}

function drawSelection() {
    View.frontCanvasContext.save();

    if (existsSelection()) {
        // draw selection
        View.frontCanvasContext.fillStyle = "rgba(0, 240, 240, 0.4)";
        View.frontCanvasContext.fillRect(selectionForLoop.xStart, 0, selectionForLoop.width, window.View.frontCanvas.height);
    }
    View.frontCanvasContext.restore();
}


function drawFrequencies() {
    View.waveCanvasContext.save();
    //View.waveCanvasContext.clearRect(0, 0, View.waveCanvas.width, View.waveCanvas.height);
    View.waveCanvasContext.fillStyle = "rgba(0, 0, 0, 0.05)";
    View.waveCanvasContext.fillRect(0, 0, View.waveCanvas.width, View.waveCanvas.height);

    var freqByteData = new Uint8Array(currentSong.analyserNode.frequencyBinCount);
    currentSong.analyserNode.getByteFrequencyData(freqByteData);
    var nbFreq = freqByteData.length;

    var SPACER_WIDTH = 5;
    var BAR_WIDTH = 2;
    var OFFSET = 100;
    var CUTOFF = 23;
    var HALF_HEIGHT = View.waveCanvas.height / 2;
    var numBars = 1.7 * Math.round(View.waveCanvas.width / SPACER_WIDTH);

    View.waveCanvasContext.lineCap = 'round';

    for (var i = 0; i < numBars; ++i) {
        var magnitude = 0.3 * freqByteData[Math.round((i * nbFreq) / numBars)];

        View.waveCanvasContext.fillStyle = "hsl( " + Math.round((i * 360) / numBars) + ", 100%, 50%)";
        View.waveCanvasContext.fillRect(i * SPACER_WIDTH, HALF_HEIGHT, BAR_WIDTH, -magnitude);
        View.waveCanvasContext.fillRect(i * SPACER_WIDTH, HALF_HEIGHT, BAR_WIDTH, magnitude);

    }

    // Draw animated white lines top
    View.waveCanvasContext.strokeStyle = "white";
    View.waveCanvasContext.beginPath();

    for (var i = 0; i < numBars; ++i) {
        var magnitude = 0.3 * freqByteData[Math.round((i * nbFreq) / numBars)];
        if (i > 0) {
            //console.log("line lineTo "  + i*SPACER_WIDTH + ", " + -magnitude);
            View.waveCanvasContext.lineTo(i * SPACER_WIDTH, HALF_HEIGHT - magnitude);
        } else {
            //console.log("line moveto "  + i*SPACER_WIDTH + ", " + -magnitude);
            View.waveCanvasContext.moveTo(i * SPACER_WIDTH, HALF_HEIGHT - magnitude);
        }
    }
    for (var i = 0; i < numBars; ++i) {
        var magnitude = 0.3 * freqByteData[Math.round((i * nbFreq) / numBars)];
        if (i > 0) {
            //console.log("line lineTo "  + i*SPACER_WIDTH + ", " + -magnitude);
            View.waveCanvasContext.lineTo(i * SPACER_WIDTH, HALF_HEIGHT + magnitude);
        } else {
            //console.log("line moveto "  + i*SPACER_WIDTH + ", " + -magnitude);
            View.waveCanvasContext.moveTo(i * SPACER_WIDTH, HALF_HEIGHT + magnitude);
        }
    }
    View.waveCanvasContext.stroke();

    View.waveCanvasContext.restore();
}

function drawSampleImage(imageURL, trackNumber, trackName) {
    var image = new Image();

    image.onload = function () {
        // SAMPLE_HEIGHT pixels height
        var x = 0;
        var y = trackNumber * SAMPLE_HEIGHT;
        View.masterCanvasContext.drawImage(image, x, y, window.View.masterCanvas.width, SAMPLE_HEIGHT);

        View.masterCanvasContext.strokeStyle = "white";
        View.masterCanvasContext.strokeRect(x, y, window.View.masterCanvas.width, SAMPLE_HEIGHT);

        View.masterCanvasContext.font = '14pt Arial';
        View.masterCanvasContext.fillStyle = 'white';
        View.masterCanvasContext.fillText(trackName, x + 10, y + 20);
    };
    image.src = imageURL;
}

function resizeSampleCanvas(numTracks) {

    window.View.masterCanvas.height = SAMPLE_HEIGHT * numTracks;
    window.View.frontCanvas.height = SAMPLE_HEIGHT * numTracks; //window.View.masterCanvas.height;


}

function clearAllSampleDrawings() {
    //View.masterCanvasContext.clearRect(0,0, canvas.width, canvas.height);
}


function playAllTracks(startTime) {
    // First : build the web audio graph
    //currentSong.buildGraph();

    //reset the scrolling on tracks
    var el = $(".trackData");
    el.scrollLeft(0);
    currentXTimeLine=0;
    // reset the elapsed time
    currentSong.stop();
    currentSong.elapsedTimeSinceStart = 0;

    // Read current master volume slider position and set the volume
    setMasterVolume();

    // Starts playing
    currentSong.play(startTime);

    // Set each track volume depending on slider value
    for (i = 0; i < currentSong.getNbTracks(); i++) {
        // set volume gain of track i the value indicated by the slider
        setVolumeOfTrackDependingOnSliderValue(i);
    }

    // Adjust the volumes depending on all mute/solo states
    currentSong.setTrackVolumesDependingOnMuteSoloStatus();


    // enable all mute/solo buttons
    //$(".mute").attr("disabled", false);
    //$(".solo").attr("disabled", false);

    // Set play/stop/pause buttons' states
    buttonPlay.disabled = true;
    buttonStop.disabled = false;
    buttonPause.disabled = false;

    // Note : we memorise the current time, context.currentTime always
    // goes forward, it's a high precision timer
    lastTime = context.currentTime;

    View.activeWaveTab();
}

function setVolumeOfTrackDependingOnSliderValue(nbTrack) {
    var fraction = $("#volume" + nbTrack).val() / 100;
    currentSong.setVolumeOfTrack(fraction * fraction, nbTrack);
}

function stopAllTracks() {
    if (currentSong === undefined) return;

    // Stop the song
    currentSong.stop();

    // update gui's state
    buttonStop.disabled = true;
    buttonPause.disabled = true;
    buttonPlay.disabled = false;

    // reset the elapsed time
    currentSong.elapsedTimeSinceStart = 0;
    currentXTimeline=0;
    cummulativeXTimeline=0;
}

function pauseAllTracks() {
    currentSong.pause();
    lastTime = context.currentTime;
}

function changeMasterVolume(){

    console.log("change volume");
    setMasterVolume(document.getElementById("masterVolume").value);
}

/*
function changeMasterVolume(goUp){
    var volume = document.getElementById("masterVolume");
    if(goUp && volume.value < 100){
        volume.value++;
        setMasterVolume(volume.value);
    }
    else if(!goUp && volume.value > 0){
        //go down
        volume.value--;
        setMasterVolume(volume.value);

    }


}
*/
// The next function can be called two ways :
// 1 - when we click or drag the master volume widget. In that case the val
// parameter is passed.
// 2 - without parameters, this is the case when we jump to another place in
// the song or when a new song is loaded. We need to keep the same volume as
// before
function setMasterVolume(val) {
    if (currentSong !== undefined) {
        // If we are here, then we need to reset the mute all button
        //document.querySelector("#bsound").innerHTML = '<span class="glyphicon glyphicon-volume-up"></span>';
        var fraction;

        // set its volume to the current value of the master volume knob
        if (val === undefined) {
            console.log("calling setMasterVolume without parameters, let's take the value from GUI");
            fraction = $("#masterVolume").val() / 100;
        } else {
            fraction = val / 100;
        }

        // Let's use an x*x curve (x-squared) since simple linear (x) does not
        // sound as good.
        currentSong.setVolume(fraction * fraction);

        console.log("volume : " + currentSong.volume);
    }
}



function soloNosoloTrack(trackNumber) {
    var s = document.querySelector("#solo" + trackNumber);
    var m = document.querySelector("#mute" + trackNumber);

    var currentTrack = currentSong.tracks[trackNumber];

    $(s).toggleClass("activated");

    // Is the current track in solo mode ?
    if (!currentTrack.solo) {
        // we were not in solo mode, let's go in solo mode
        currentTrack.solo = true;
        // Let's change the icon
        s.innerHTML = "<span class='glyphicon glyphicon-headphones'></span>";
    } else {
        // we were in solo mode, let's go to the "no solo" mode
        currentTrack.solo = false;
        // Let's change the icon
        s.innerHTML = "<span class='glyphicon glyphicon-headphones'></span>";
    }

    // In all cases we remove the mute state of the curent track
    currentTrack.muted = false;
    $(m).removeClass("activated");
    // Let's change the icon
    m.innerHTML = "<span class='glyphicon glyphicon-volume-up'></span>";

    // Adjust the volumes depending on all mute/solo states
    currentSong.setTrackVolumesDependingOnMuteSoloStatus();
}


function muteUnmuteTrack(trackNumber) {
    var m = document.querySelector("#mute" + trackNumber);
    var s = document.querySelector("#solo" + trackNumber);

    var currentTrack = currentSong.tracks[trackNumber];

    $(m).toggleClass("activated");

    if (!currentTrack.muted) {
        // Track was not muted, let's mute it!
        currentTrack.muted = true;
        // let's change the button's class
        m.innerHTML = "<span class='glyphicon glyphicon-volume-off'></span>";
    } else {
        // track was muted, let's unmute it!
        currentTrack.muted = false;
        m.innerHTML = "<span class='glyphicon glyphicon-volume-up'></span>";
    }

    // In all cases we must put the track on "no solo" mode
    currentTrack.solo = false;
    $(s).removeClass("activated");
    // Let's change the icon
    s.innerHTML = "<span class='glyphicon glyphicon-headphones'></span>";

    // adjust track volumes dependinf on all mute/solo states
    currentSong.setTrackVolumesDependingOnMuteSoloStatus();
}

function masterMuteUnmute(btn) {
    if (currentSong === undefined) return;

    currentSong.toggleMute();

    $(btn).toggleClass("activated");

    if (currentSong.muted) {
        btn.innerHTML = '<span class="glyphicon glyphicon-volume-off"></span>';
    } else {
        btn.innerHTML = '<span class="glyphicon glyphicon-volume-up"></span>';
    }
}

function toggleRecordMix() {
    currentSong.toggRecordMixMode();
    $("#brecordMix").toggleClass("activated");

    clearLog();
    log("Record mix mode : " + currentSong.recordMixMode);
    if (currentSong.recordMixMode) {
        log("Play to start recording,");
        log("Stop to save the mix as .wav");
    }
}
