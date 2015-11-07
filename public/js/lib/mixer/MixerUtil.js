
var MixerUtil = {};

MixerUtil.isRecordingOn = false;
MixerUtil.selectedTrackDtoForNewSong = null;

MixerUtil.btn = {};
MixerUtil.btn.play = 'bplay';
MixerUtil.btn.stop = 'bstop';
MixerUtil.btn.mute = 'bmute';
MixerUtil.btn.record = 'brecordMix';
MixerUtil.btn.volume = 'masterVolume';
MixerUtil.btn.saveSong = 'bsaveSong';
MixerUtil.btn.searchCollaborators = 'bcollaborators';
MixerUtil.buttonsIds=[];

for(var key in MixerUtil.btn){
    MixerUtil.buttonsIds.push(MixerUtil.btn[key]);
}

//TODO implement better browser detection logic
var keyEventElement = (window.navigator.userAgent.indexOf("Firefox") > -1) ? document.body : '#myModal';

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

MixerUtil.addCollaboratorToUi = function(userDto) {
    log.debug("collaborator: " + JSON.stringify(userDto));
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

/**
 *
 * @param value
 * @param index
 */
MixerUtil.updateTrackLabel = function(value, index){

    document.getElementById("trackLabel"+index).innerHTML= value.substring(0,15) + "...";

};

/**
 *
 * @param trackDto
 */
MixerUtil.selectTrackForNewSong = function(trackDto){

    MixerUtil.selectedTrackDtoForNewSong = trackDto;
    MixerUtil.toggleNotification($("#newSongFromTrack"));
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
            document.getElementById(uiId).style.display='none';
            mixer.currentSongDto.tracks.splice(i,1);
            break;
        }
    }

    log.debug("after mixer.currentSongDto track size: " + mixer.currentSongDto.tracks.length + " \n" + JSON.stringify(mixer.currentSongDto.tracks));


};

/**
 * Create a new song with the selected track
 */
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
            log.debug("saved song: " + data);

            $('#notificationBody').html("Saved Successfully. Refreshing Page");
            $('#myModal').modal('toggle');

            window.location.href="/mixer?song="+data.id;

        },
        fail: function(data){
            alert('error');
        }
    });

}

/**
 *
 * @param el
 * @param role
 * @returns {boolean}
 */
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

}


/**
 *
 * @param trackNumber
 */
MixerUtil.toggleEditTrack = function(trackNumber){

    MixerUtil.toggleNotification($('#trackInfo'+trackNumber));
}

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
MixerUtil.toggleEditSong = function(closeMe){

    MixerUtil.toggleNotification($('#songInfo'));

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

MixerUtil.toggleRecording = function(){

    if(MixerUtil.isRecordingOn){
        //stop recording and close dialog
        MixerUtil.isRecordingOn=false;

        document.getElementById("recordingWav").style.display="none";
        $('#myModal').modal('toggle');
        document.getElementById("modalCloseBtn").style.display="inline";
        document.getElementById("modalXCloseBtn").style.display="inline";
        $(keyEventElement).off('keypress', MixerUtil.toggleRecording);
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
        MixerUtil.isRecordingOn=true;
        //start the equalizer
        var startRecording = 6;
        var div = document.getElementById("timer");

        document.getElementById("recordingWav").style.display="block";
        document.getElementById("modalCloseBtn").style.display="none";
        document.getElementById("modalXCloseBtn").style.display="none";
        $('#myModal').modal('toggle');
        MixerUtil.toggleNotification(null, true);
        setInterval(function(){

            if(--startRecording > 0){

                if(startRecording == 1){
                    mixer.playPauseAll();
                    div.innerHTML = "PLAY!";

                    // start recording

                    updateAnalysers();

                    audioRecorder.clear();
                    audioRecorder.record();

                    div.innerHTML="Press the space bar to stop recording";

                    $(keyEventElement).on('keypress',MixerUtil.toggleRecording);

                }
                else{
                    div.innerHTML = "Start playing in " + startRecording + "...";
                }
                $('#notificationBody').html($('#recordingDialog').html());

            }
            else{
                clearInterval();
            }

        },1000);



    }

}