
var MixerUtil = {};

MixerUtil.isRecordingOn = false;
MixerUtil.selectedTrackDtoForNewSong = null;

MixerUtil.btn = {};
MixerUtil.btn.play = 'bplay';
MixerUtil.btn.stop = 'bstop';
MixerUtil.btn.record = 'brecordMix';
MixerUtil.btn.saveSong = 'bsaveSong';
MixerUtil.btn.searchCollaborators = 'bcollaborators';
MixerUtil.buttonsIds=[];
MixerUtil.latencyTime=null;
MixerUtil.recordingDto=null;

for(var key in MixerUtil.btn){
    MixerUtil.buttonsIds.push(MixerUtil.btn[key]);
}

//TODO implement better browser detection logic
var keyEventElement = (window.navigator.userAgent.indexOf("Firefox") > -1) ? document.body : '#myModal';

/**
 * Push notifications to UI showing which updates were made, and indicating un-saved changes
 * Adds edit info to mixer to save
 * @param editAlert
 */
MixerUtil.notifyOfChanges = function(editAlert){

    log.trace('enter notifyOfChanges');
    $("#bsaveSong").notify("You have un-saved changes", { position:"top", autoHide:false });
    var editDto = new EditDto(user.id, editAlert);
    mixer.newEdits.push();

    $.notify(editAlert);
};

/**
 * Enable or disable the buttons
 * @param btnIdArray button id array
 * @param enableOrDisable
 */
MixerUtil.enableOrDisableButtons = function(btnIdArray, enableOrDisable){

    log.trace("enter enableDisableButtons");

    log.debug('button id length: ' +btnIdArray.length);

    for(var i = 0; i < btnIdArray.length; i++){
        log.debug('******* ' + btnIdArray[i]);
        document.getElementById(btnIdArray[i]).disabled = enableOrDisable;
    }
};

/**
 * Updates UI with collaborator info
 * @param userDto
 */
MixerUtil.addCollaboratorToUi = function(userDto) {
    log.debug("collaborator: " + JSON.stringify(userDto));
    var div = $('<div class="col-sm-2"></div>');
    var img = $('<img class="collaborator thumbnail">');
    img.attr('src', "/uploads/users/profile/"+userDto.profilePic);
    img.appendTo(div);
    div.append("<div style='display:inline'>"+userDto.firstName+"</div>");
    div.appendTo('#collaborators');
};

/**
 * Open or close the collaborator dialog
 * @param closeMe
 */
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

};



/**
 *
 * @param value
 * @param index
 */
MixerUtil.updateTrackLabel = function(value, index){

    document.getElementById("trackLabel"+index).innerHTML= value.substring(0,15) + "...";

};

MixerUtil.createOrUpdateSongInfo = function(){

    var errors = SongValidation.validateSongFieldData(document.getElementById('songName').value);

    if(errors.length){
        NotificationUtil.error(errors.join("\n<br/> * "), true, 'songFormNotifications');
        return;
    }
    else{
        mixer.saveSong();
        return;
    }
};

/**
 *
 * @param uiId
 */
MixerUtil.removeTrackFromSong = function(uiId){

    if(!confirm("Are you sure you want to remove this track")){
        return;

    }

    log.debug("before mixer.currentSongDto tracks size: " + mixer.currentSongDto.tracks.length + " \n" + JSON.stringify(mixer.currentSongDto.tracks));

    for(var i =0; i < mixer.currentSongDto.tracks.length; i++){
        if(mixer.currentSongDto.tracks[i].uiId == uiId){
            log.debug('removing track: ' + $("#"+uiId).html());
            MixerUtil.notifyOfChanges('Removed Track: ' + document.getElementById('trackName' + mixer.currentSongDto.tracks[i].uiId).value);
            document.getElementById(uiId).style.display='none';
            mixer.currentSongDto.tracks.splice(i,1);
            break;
        }
    }

    log.debug("after mixer.currentSongDto track size: " + mixer.currentSongDto.tracks.length + " \n" + JSON.stringify(mixer.currentSongDto.tracks));


};

/*
Edit song
Edit track
 Add track
 Remove track
Add collaborator

 */

/**
 *
 * @param uiId -- track uiId
 */
MixerUtil.selectTrackForNewSong = function(uiId){

    MixerUtil.selectedTrackUiId = uiId;
    MixerUtil.toggleNotification($("#newSongFromTrack"));
};

/**
 * Create a new song with the selected track
 */
MixerUtil.createNewSongFromTrack = function(){

    log.trace("enter createNewSongFromTrack");

    var newSongDto = new SongDto();
    newSongDto.name = document.getElementById('newSongName').value;
    newSongDto.description = document.getElementById('newSongDescription').value;

    var trackDto = mixer.getTrackByUiId(MixerUtil.selectedTrackUiId);
    newSongDto.tracks.push(trackDto);

    var formData = new FormData();
    formData.append("song", JSON.stringify(newSongDto));

    $('#savingModal').modal('toggle');

    $.ajax({
        url: '/song/save',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        type: 'POST',
        success: function(data){

            //TODO need to handle errors too
            log.debug("saved song: " + data);

            $('#notificationBody').html("Saved Successfully. Refreshing Page");
            $('#myModal').modal('toggle');

            window.location.href="/songMixer?song="+data.id;

        },
        fail: function(error){
            alert('There was an error creating a song from this track: ' + error);
        }
    });

};

/**
 *
 * @param el
 * @param role
 * @returns {boolean}
 */
MixerUtil.validateAndNotify = function(el, role){

    if(!user){
        $(el).notify('You must login first', 'error');
        return false;
    }

    if(role == AppConstants.ROLES.ADMIN){
        if(!SongValidation.isAdmin(user, songDto)){
            $(el).notify('You must be an admin to perform this action', 'error');
            return false;
        }
    }

    if(role == AppConstants.ROLES.ADD_TRACK){
        if(!SongValidation.canAddTrack(user, songDto)){
            $(el).notify('You must be collaborator to perform this action', 'error');
            return false;
        }
    }


    return true;
};

/**
 *
 * @param el
 * @returns {boolean}
 */
MixerUtil.isLoggedIn = function(el){

    if(user){
        return true;
    }

    $(el).notify('You must login first', 'info');
    return false;
};

/**
 * submit a search for collaborators and display a dialog to add them to the song
 */
MixerUtil.searchCollaborators = function(){

    if(!MixerUtil.isLoggedIn(document.getElementById("bcollaborators"))){
        return;
    }

    var searchDto = {
        type : "USER",
        firstName : document.getElementById("searchFirstName").value,
        lastName : document.getElementById("searchLastName").value,
        email : document.getElementById("searchEmail").value
    };

    $.ajax({
        url: '/search',
        data : JSON.stringify(searchDto),
        cache: false,
        contentType: 'application/json',
        processData: false,
        type: 'POST',
        success: function(data){
            log.debug(data);
            //display search results
            var output="<ul>";

            $( data ).each(function( index ) {

                output += "<li><a href='#' onclick='MixerUtil.addCollaborator ("+JSON.stringify(this)+");' >" + this.firstName + " " + this.lastName + "</a></li>";
            });

            output += "</ul>";

            document.getElementById("searchUsersData").innerHTML=output;
        }
    });
};

/**
 *
 * @param userDto
 */
MixerUtil.addCollaborator = function(userDto){

    log.debug("add userDto: " + userDto);
    var formData = new FormData();
    var collaboratorDto = {
        'id' : userDto.id,
        'roles' : ['ADD_TRACK'],
        'invitationAccepted' : false
    };

    mixer.currentSongDto.collaborators.push(collaboratorDto);
    MixerUtil.addCollaboratorToUi(userDto);

};


/**
 *
 * @param trackNumber
 */
MixerUtil.toggleEditTrack = function(trackNumber){

    MixerUtil.toggleNotification($('#trackInfo'+trackNumber));
};

/**
 *
 * @param content
 * @param doNotToggle
 */
MixerUtil.toggleNotification = function(content, doNotToggle){

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

};

/**
 * Show or hide the edit song dialog
 * @param closeMe
 */
var songLoaded=false;
MixerUtil.toggleEditSong = function(closeMe){

    MixerUtil.toggleNotification($('#songInfo'), closeMe);

    if(!songLoaded){
        setTimeout(function() {

            var options = {
                container     : document.getElementById('songWav'),
                waveColor: '#1989D4',
                progressColor: '#2BAD1D ',
                cursorColor   : 'navy'
            };

            songWavesurfer.init(options);
            songWavesurfer.load('/uploads/'+songDto.fileName);
            songLoaded=true;
        },500);
    }
};

/**
 *
 * @param closeMe
 */
MixerUtil.toggleSearchUsers = function(closeMe){

    if(!SongValidation.isAdmin(user, songDto)){
        document.getElementById('searchUsersForm').style.display='none';
    }
    MixerUtil.toggleNotification($('#searchUsers'));
};


/**
 * Stops or starts a new recording
 */
MixerUtil.toggleRecording = function(){

    var countDownTimerEl = document.getElementById('countdownTimer');
    var countDownInfoEl = document.getElementById('countdownInfo');
    var recordingAnalyzerEl = document.getElementById("recordingWav");
    var modalXCloseEl =document.getElementById("modalXCloseBtn");

    if(MixerUtil.isRecordingOn){

        //stop recording and close dialog
        MixerUtil.isRecordingOn=false;
        countDownInfoEl.textContent='';
        countDownTimerEl.textContent='';
        recordingAnalyzerEl.style.display="none";
        modalXCloseEl.style.display="inline";

        $(keyEventElement).off('keypress', function(){
            MixerUtil.toggleRecording();
        });



        $('#myModal').modal('toggle');

        //stop the equalizer
        cancelAnalyserUpdates();
        //stop countdown
        clearInterval(MixerUtil.countdownTimer);
        // stop recording
        audioRecorder.stop();
        //audioRecorder.getBuffer( gotBuffers );

        audioRecorder.endRecording(finishedProcessing);

    }
    else{
        console.log("start recording");
        if (!audioRecorder){
            $.notify("There was an error attempting to record. Please ensure your browser settings allow us to access your mic.", "error");
            return;
        }
        if (MixerUtil.latencyTime==null){
            $.notify("There was an error attempting to record. You need to re-callibrate your system before recording.", "error");
            MixerUtil.toggleCallibrateDialog();
            return;
        }


        //start recording
        MixerUtil.isRecordingOn=true;

        //start the equalizer
        var startRecording = 6;
        var startTimerEl = document.getElementById("startTimer");

        recordingAnalyzerEl.style.display="block";
        modalXCloseEl.style.display="none";

        MixerUtil.toggleNotification($('#recordingDialog'));

        var maxTrackDuration = 180; //60 * 3;



        document.getElementById("startTimer").textContent="Connected!";

        setInterval(function(){

            if(--startRecording >= 0){

                if(startRecording ==1){
                    MixerUtil.startTimer(maxTrackDuration, countDownTimerEl); //timer has a one sec delay
                }
                if(startRecording == 0){

                    // start recording

                    audioRecorder.record();

                    setTimeout(function() {

                        mixer.playPauseAll();
                        updateAnalysers();

                    },50);


                    document.getElementById("startTimer").textContent="Press the space bar to stop recording";
                    countDownInfoEl.textContent = 'or recording will automatically end in';
                   // $(keyEventElement).on('keypress',MixerUtil.toggleRecording);



                }
                else{
                    document.getElementById("startTimer").textContent = "Start playing in " + startRecording + "...";
                }

            }
            else{
                clearInterval();

            }

        },1000);



    }

};

/**
 * Starts a timer and updates the UI element contents
 * @param duration - length you want to countdown to
 * @param el - html element to update it's textContent
 */
MixerUtil.startTimer = function(duration, el) {

    var timer = duration, minutes, seconds;
    MixerUtil.countdownTimer = setInterval(function () {
        log.debug("updating timer");
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        el.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            log.debug("ending timer......");
            timer = duration;
            MixerUtil.toggleRecording();

        }
    }, 1000);
};


///////

MixerUtil.latencyBufferLength = 16384;
MixerUtil.latencyThreshold = 0.125;  // -18dB

MixerUtil.toggleCallibrateDialog = function(){
    MixerUtil.toggleNotification($('#callibrationDialog'));
};

MixerUtil.callibrateSystem = function(){

    navigator.getUserMedia(
        {audio:{optional:[{echoCancellation:false}]}}, MixerUtil.testLatency, function(e) {
            console.log(e);
        });
};

MixerUtil.endTest = function(outTimes, inTimes) {

    var elInfoId = 'callibrationResults';
    if (inTimes.length === 0) {
        document.getElementById(elInfoId).textContent="No input has been detected. Have you connected an output to an input?";
        return;
    }

    else if (outTimes.length < inTimes.length) {
        document.getElementById(elInfoId).textContent=inTimes.length + ' signals were detected, but only ' + outTimes.length + ' were sent. Is there a lot of noise in your system? Try and keep background noise below -18dB.';
        return;
    }

    else if (outTimes.length > inTimes.length) {
        document.getElementById(elInfoId).textContent='Only ' + inTimes.length + ' signals were detected, where ' + outTimes.length + ' were sent. Have you got your input gain turned up enough?';
        return;
    }

    log.debug('outTimes: ' +outTimes + 'inTimes: ' + inTimes);

    var latencyTimes = [];
    var n = outTimes.length;

    while (n--) {
        latencyTimes[n] = inTimes[n] - outTimes[n];
    }

    var min = Math.min.apply(Math, latencyTimes);
    var max = Math.max.apply(Math, latencyTimes);
    var range = max - min;

    if (range > 128) {
        // That's a lot of variance in the resulting times. Looks a bit suspect.
        document.getElementById(elInfoId).textContent='There is too much varience in the callibration. Please make sure you are in a quiet room, and the mic is still and try running the test again.';
        return;
    }

    log.debug(min, max);

    var n = latencyTimes.length;
    var avg = 0;

    while (n--) {
        avg += latencyTimes[n] / latencyTimes.length;
    }

    log.debug('Average round-trip latency samples:', avg, 'ms:', avg / 44100);


    MixerUtil.latencyTime=(avg / 44100);
    document.getElementById(elInfoId).innerHTML="<b>Callibration is complete! You may start recording now.</b>" + '<button type="button" class="btn btn-primary btn-sm" id="modalCloseBtn" data-dismiss="modal">Close</button>';
    MixerUtil.setCookie('systemLatency', (avg / 44100));

    log.debug('latency : ' + MixerUtil.recordingDto.latencyTime);
};

MixerUtil.testLatency = function(stream) {

    gain = audioContext.createGain();
    realAudioInput = audioContext.createMediaStreamSource(stream);
    realAudioInput.connect(gain);

    var node = audioContext.createScriptProcessor(MixerUtil.latencyBufferLength, 1, 1);
    var frame = -1;
    var inputTimes = [];
    var outputTimes = [];

    // Keep a reference to the node around to avoid Chrome's garbage
    // collection.
    window.hfiuxw4i8mwxvhmlu = node;

    node.onaudioprocess = function(e){
        var inputBuffer = e.inputBuffer;
        var outputBuffer = e.outputBuffer;
        var inputSamples = inputBuffer.getChannelData(0);
        var outputSamples = outputBuffer.getChannelData(0);
        var first = false;

        ++frame;

        if (frame > 12) {
            // Last frame. End the test...
            MixerUtil.endTest(outputTimes, inputTimes);
            gain.disconnect();
            node.disconnect();
        }

        if (frame % 3 - 1 === 0) {
            // Every third frame, give the samples an impulse
            outputSamples[0] = 1;
            outputSamples[1] = 1;
            first = true;
            outputTimes.push(MixerUtil.latencyBufferLength * frame + MixerUtil.latencyBufferLength);
        }
        else {
            // The rest of the time send silence
            outputSamples[0] = 0;
            outputSamples[1] = 0;
        }

        var n = -1;
        var l = inputSamples.length;

        // Detect an impulse. Leave frame 0 out to avoid click noise.
        if (frame > 0) {
            while (++n < l) {
                if (Math.abs(inputSamples[n]) > MixerUtil.latencyThreshold) {
                    inputTimes.push(MixerUtil.latencyBufferLength * frame + n - MixerUtil.latencyBufferLength);
                    // Dont detect any more than one peak per frame.
                    return;
                }
            }
        }
    };

    gain.connect(node);
    node.connect(audioContext.destination);
};

MixerUtil.setCookie = function(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + "; ";
};

MixerUtil.getCookie =function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0)
            console.log('found cookie with value: ' +c.substring(name.length, c.length));
            return c.substring(name.length, c.length);
    }
    return null;
};
