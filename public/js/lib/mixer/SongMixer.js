
var SongMixer = function(songDto){

    log.trace("enter SongMixer");

    var mixer = this; //use in ajax call backs

    this.newEdits=[];
    //the current song that was loaded
    this.currentSongDto;
    //array of users who created tracks here
    this.musicians={};

    this.masterGainNode;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    /**
     * Init
     */
    this.init = function() {

        log.trace("enter init");

        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);

        MixerUtil.enableOrDisableButtons(MixerUtil.buttonsIds, true);

        if (songDto != null) {

            this.currentSongDto = songDto;
            log.debug("new song loaded, name: " + songDto.name);

            $.when(this.getAllCollaborators(songDto)).done(function(musicians){

                mixer.musicians = musicians;

                for(var i = 0; i < songDto.tracks.length; i++){
                    mixer.addTrack(songDto.tracks[i], false);
                }

                MixerUtil.enableOrDisableButtons(MixerUtil.buttonsIds, false);
                MixerUtil.enableOrDisableButtons([MixerUtil.btn.stop], true);
            });


        }
        else {
            log.debug("create a new SongDto");
            MixerUtil.enableOrDisableButtons(MixerUtil.buttonsIds, true);
            MixerUtil.enableOrDisableButtons([MixerUtil.btn.saveSong,MixerUtil.btn.record,MixerUtil.btn.searchCollaborators], false);
            this.currentSongDto = new SongDto();
        }

        return this;
    };

    /**
     * Load collaborators in
     * @param songDto
     */
    this.getAllCollaborators = function(songDto){

        log.trace("enter loadCollaborators");

        var d = $.Deferred();

        //load collaborators
        var searchDto = new SearchCriteriaDto();
        searchDto.type = "USER_IDS";

        for(var i = 0; i < songDto.collaborators.length; i++){
            searchDto.userIds.push(songDto.collaborators[i].id);
        }

        for(var i = 0; i < songDto.tracks.length; i++){
            searchDto.userIds.push(songDto.tracks[i].creatorId);
        }

        searchDto.userIds.push(songDto.creatorId);

        //TODO we should load in the collaborator info server side
        $.ajax({
            url: '/search',
            data: JSON.stringify(searchDto),
            cache: false,
            contentType: 'application/json',
            processData: false,
            type: 'POST',
            success: function(data){
                log.debug('found collaborators: '+data);
                var musicians = {};
                $( data ).each(function( index ) {
                    log.debug("loading musician: " + JSON.stringify(this));

                    MixerUtil.addCollaboratorToUi(this);
                    musicians[this.id]=this;

                });

                log.debug("musicians: " + JSON.stringify(musicians));
                d.resolve(musicians);

            }
        });

        return d.promise();
    };

    /**
     * Save the current song
     */
    this.saveSong = function(){

        log.trace("enter save");

        if(!MixerUtil.validateAndNotify(document.getElementById("bsaveSong"), AppConstants.ROLES.ADD_TRACK)){
            return;
        }

        var formData = new FormData();

        this.currentSongDto.name = $("#songName").val();
        this.currentSongDto.description = $("#songDescription").val();
        this.currentSongDto.tags = $("#songTags").val();
        this.currentSongDto.isPublic = $("#songIsPublic").is(':checked');

        for(var i = 0; i < this.currentSongDto.tracks.length; i++){

            var songTrackDto = this.currentSongDto.tracks[i];
            songTrackDto.trackMixer=null;
            if(!songTrackDto.removed || songTrackDto.originalTrackDto !== undefined) {

                songTrackDto.viewOrder = i;
                var trackName = document.getElementById('trackName' + songTrackDto.uiId).value;
                var trackDescription = document.getElementById('trackDescription' + songTrackDto.uiId).value;

                log.debug("trackName: " + trackName);

                var trackTags = $('#trackTags' + songTrackDto.uiId).val();

                if(songTrackDto.originalTrackDto !== undefined){
                    log.debug('updating existing track');
                    songTrackDto.originalTrackDto.name = trackName;
                    songTrackDto.originalTrackDto.description = trackDescription;
                    songTrackDto.originalTrackDto.tags = trackTags;
                    songTrackDto.originalTrackDto.removed=true;
                }
                else{

                    log.debug("adding new track");
                    songTrackDto.name = trackName;
                    songTrackDto.description = trackDescription;
                    songTrackDto.tags = trackTags;
                    formData.append("newTrack_" + i, songTrackDto.blobData, "song.wav");
                }

            }
        }

        formData.append("song", JSON.stringify(this.currentSongDto));

        log.debug("saveTrack: , song: " + $('#songName').val() + " with desc: " + $('#songDescription').val() + " and tracks: " + JSON.stringify(formData));

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
                if(data.error){
                    log.debug('error saving song: ' + data.error);
                    $('#savingModal').modal('toggle');
                    $('#notificationBody').html("There was an error saving your song: " + data.error);
                    $('#myModal').modal('toggle');
                    return;
                }
                console.log("saved song: " + data);

                $('#notificationBody').html("Saved Successfully. Refreshing Page");
                $('#myModal').modal('toggle');

                window.location.href="/songMixer?song="+data.id;

            }
        });
    };

    /**
     *
     */
    this.playPauseAll = function(){

        log.trace("enter playPauseAll");
        //$(".trackRow").trigger("playPauseAll");

        MixerUtil.enableOrDisableButtons([MixerUtil.btn.stop], false);
        //return;

        if(this.soloTrack !=null){
            this.soloTrack.trackMixer.wavesurfer.playPause();
        }
        else{

            for(var i = 0; i < this.currentSongDto.tracks.length; i++){
                this.currentSongDto.tracks[i].trackMixer.wavesurfer.playPause();
                log.debug("*** playing track on the milli second: " + new Date().getMilliseconds());
            }
        }


    };

    /**
     *
     */
    this.stopAll = function(){
        log.trace("enter stop All");

        for(var i = 0; i < this.currentSongDto.tracks.length; i++){
            this.currentSongDto.tracks[i].trackMixer.wavesurfer.stop();
        }
    };


    this.toggleActiveClass = function(el,uiId){

        log.trace("enter toggleMuteSong");
        $(el).toggleClass("activated");
    };
    /**
     *
     * @param el - the html element which called the function
     * @param uiId - uiId of the track
     */
    this.toggleMuteTrack = function(el, uiId){

        log.trace("enter toggleMuteSong");
        this.getTrackByUiId(uiId).trackMixer.wavesurfer.toggleMute();
        this.toggleActiveClass(el);
    };

    this.toggleSoloTrack = function(el, uiId){

        log.trace("enter toggleSoloTrack");
        $(el).toggleClass("activated");
        if(this.soloTrack == null){
            this.soloTrack = this.getTrackByUiId(uiId);
        }
        else{
            this.soloTrack=null;
        }
    };



    /**
     * Adjust a tracks volume
     * @param trackUiId
     * @param volume
     */
    this.adjustTrackVolume = function(trackUiId, volume){
        log.trace("enter adjustTrackVolume with volume: " + volume);
        var trackDto = this.getTrackByUiId(trackUiId);
        trackDto.trackMixer.wavesurfer.setVolume(volume/100);
    };


    /**
     * this was just experimental, the recording comes out as non-sense.
     * I'm guessing the tracks need to be the same length, or more feasibly this could be done
     * by piping all tracks through a master gain node, but not in real time.???
     *
     *
     */
    this.downloadTrackMix = function(){

        var bufferSize=0;
        var duh;
        for(var i = 0; i < this.currentSongDto.tracks.length; i++){
            var trackDto = this.currentSongDto.tracks[i];
            var channelDataArray=[];

            log.debug('num channels: ' + trackDto.trackMixer.wavesurfer.backend.buffer.numberOfChannels);
            log.debug('channel length: ' + trackDto.trackMixer.wavesurfer.backend.buffer.getChannelData(0).length);

            for(var c = 0; c < trackDto.trackMixer.wavesurfer.backend.buffer.numberOfChannels; c++){
                bufferSize += trackDto.trackMixer.wavesurfer.backend.buffer.getChannelData(c).length;
                channelDataArray[c]= trackDto.trackMixer.wavesurfer.backend.buffer.getChannelData(c);
            }
        }

        //recorder.workder.mergeBuffers - creates a Float32Array
        //recorder.worker.encodeWav takes a float32Array and returns a blob
        log.debug("bufferSize: " + bufferSize);




        new Recorder(this.masterGainNode).exportWavFromBuffers(function (blob) {
            var fileName = mixer.currentSongDto.name + ".wav";
            log.debug("Saved mix!");
            log.debug("file: " + fileName);
            Recorder.forceDownload(blob, fileName);
        }, channelDataArray, bufferSize);

    };

    /**
     * Get a track based on it's uiId
     * @param uiId
     * @returns {*}
     */
    this.getTrackByUiId = function(uiId){

        log.trace("enter getTrackByUiId with: " + uiId);

        for(var i = 0; i < this.currentSongDto.tracks.length; i++){

            if(uiId == this.currentSongDto.tracks[i].uiId){
               return this.currentSongDto.tracks[i];
            }

        }

        return null;
    };


    /**
     * Creates a new track from a recording
     * @param blob - the recording data in a blob format new Blob([arrayBuffer], {type: "audio/wav"}
     */
    this.addNewRecording = function(blob){

        log.trace("enter addNewRecording");

        var trackDto = new TrackDto();
        trackDto.uiId="_uiId_"+Math.random().toString().replace(".","");
        trackDto.name="new track";
        trackDto.description="";
        trackDto.blobData = blob;

        this.addTrack(trackDto, true);

        this.currentSongDto.tracks.push(trackDto);

    };


    /**
     *
     */
    this.addTrack = function(trackDto, isNewRecording){

        log.trace("enter addTrack");

        log.debug("adding track: " + JSON.stringify(trackDto));
        log.debug("adding original track: " + JSON.stringify(trackDto.originalTrackDto));

       trackDto.trackMixer = new TrackMixer(this.audioContext);


        var creatorImage = "<img src='/uploads/users/profile/shadow.jpg' width='30' height='30' />";

        if (!isNewRecording) {
            creatorImage = "<img class='thumbnailSmall' src='/uploads/users/profile/" + this.musicians[trackDto.originalTrackDto.creatorId].profilePic + "' width='50' height='50' />&nbsp;";
        }

        var trackInfo = "<div class='col-md-2'>" +
            "<div class='row'>" + creatorImage +
            "<button class='mute' id='bmute" + trackDto.uiId + "' onclick='mixer.toggleMuteTrack(this,\"" + trackDto.uiId + "\");'><span class='glyphicon glyphicon-volume-up'></span></button>" +
            " <button class='solo' id='bsolo" + trackDto.uiId + "' onclick='mixer.toggleSoloTrack(this,\"" + trackDto.uiId + "\");'><span class='glyphicon glyphicon-headphones' title='Mute all other tracks except for this one.'></span></button>";

        if (!isNewRecording) {
            trackInfo += " <button class='createNewSongWithTrack' id='createNewSongWith" + trackDto.uiId + "' onclick='MixerUtil.selectTrackForNewSong(\"" + trackDto.uiId + "\");' title='Create a new Song with this track' ><span class='glyphicon glyphicon-plus'></span></button>";
        }
        trackInfo += " <button class='removeTrack' id='removeTrack" + trackDto.uiId + "' onclick='MixerUtil.removeTrackFromSong(\"" + trackDto.uiId + "\");' title='Remove this track from song' ><span class='glyphicon glyphicon-remove-sign'></span></button>";

        //add in tag info
        var trackTags='';
        var trackName='Track #' + this.currentSongDto.tracks.length;
        var trackDescription='';
        var disabled='';
        if(trackDto.originalTrackDto !== undefined){
            log.debug("originalTrackDto name: " + trackDto.originalTrackDto.name);
            trackName = trackDto.originalTrackDto.name;
            trackDescription = trackDto.originalTrackDto.description;

            if (trackDto.originalTrackDto.tags) {
                for (var i = 0; i < trackDto.originalTrackDto.tags.length; i++) {
                    trackTags += '<option value="'+trackDto.originalTrackDto.tags[i]+'" selected>'+trackDto.originalTrackDto.tags[i]+'</option>\n';
                }
            }

            if(trackDto.originalTrackDto.creatorId != user.id){
                disabled='disabled';
            }


        }

        trackInfo += "</div>" +
            "<div class='row'>" +
            "<a href='#' onclick='MixerUtil.toggleEditTrack(\"" + trackDto.uiId + "\");' ><span id='trackLabelIcon" + trackDto.uiId + "' class='glyphicon glyphicon-pencil'></span> Edit: <span id='trackLabel" + trackDto.uiId + "'>" + trackName.substring(0, 20) + "...</span></a>" +

            "<div style='display:none'>" +
            " <div id='trackInfo" + trackDto.uiId + "'> " +
            "    <div class='row'> " +
            "        <div class='form-group'><label for='trackName" + trackDto.uiId + "'>Track Name</label> " +
            "        <input type='text' class='form-control' name='Track Name' id='trackName" + trackDto.uiId + "' "+disabled+" class='trackName' value='" + trackName + "' name='trackName" + trackDto.uiId + "' placeholder='Enter a name for this track' onchange='MixerUtil.updateTrackLabel(this.value,\"" + trackDto.uiId + "\");'/></div> " +
            "        <div class='form-group'><label for='trackDescription" + trackDto.uiId + "' >Description</label>" +
            "        <textarea class='form-control' name='Track Description' id='trackDescription" + trackDto.uiId + "' placeholder='Enter a description for this track' " + disabled +" >" + trackDescription + "</textarea></div> " +
            "        <div><label for='trackTags" + trackDto.uiId + "''>Intrument/genre tags</label>&nbsp;<i>(Hit enter after each tag)</i><br />" +
            "        <select name='Track Tags' id='trackTags" + trackDto.uiId + "' multiple " + disabled + ">"+trackTags+"</select></div><br />" +
            "    </div> " +
            "    <div class='modal-footer modalNotificationFooter'><button type='button' class='btn btn-default' data-dismiss='modal'>Close</button></div>" +
            "  </div> " +
            "</div> " +
            "<span id='volspan'><input type='range' class = 'volumeSlider' id='volume" + trackDto.uiId + "' min='0' max = '100' value='100' style='width:150px' oninput='mixer.adjustTrackVolume(\"" + trackDto.uiId + "\", this.value);'/></span>" +
            "</div>" +
            "</div>";

        var waveDivId = 'track_waveform'+trackDto.uiId;

        var trackCanvas = document.createElement('div');
        trackCanvas.className = "col-md-10 trackData";
        trackCanvas.id = waveDivId;


        var trackRow =  document.createElement('div');
        trackRow.className="row trackRow";
        trackRow.id = trackDto.uiId;
        trackRow.style.backgroundColor="#9999";
        trackRow.innerHTML = trackInfo + trackCanvas.outerHTML;
        $("#scroll").append(trackRow);



        $('#trackTags'+trackDto.uiId).tagsinput({
            typeaheadjs: {
                name: 'instruments',
                displayKey: 'name',
                valueKey: 'name',
                source: tags.ttAdapter()
            }
        });

        if(isNewRecording){
            trackDto.trackMixer.initBlob(waveDivId, trackDto.blobData);
        }
        else{
            trackDto.trackMixer.initUrl(waveDivId, '/uploads/'+trackDto.originalTrackDto.fileName);
        }

        //don't think i need to a master volume, we can just use individual track volume and the master volume will be the PC
       // trackDto.trackMixer.wavesurfer.backend.gainNode.disconnect(); -- this gave some odd results
        trackDto.trackMixer.wavesurfer.backend.gainNode.connect(this.masterGainNode);

        /*
        //I didn't see any sequence delay difference when calling the play based on an event vs just looping through them
        //in fact it seemed like looping gave more consistant time results then the event driven approach
        $('#'+trackDto.uiId).data('trackDto',trackDto);

        $('#'+trackDto.uiId).on('playPauseAll',function(){
            $(this).data('trackDto').trackMixer.wavesurfer.playPause();
            log.debug("*** playing track on the milli second: " + new Date().getMilliseconds());
        });

        $(".trackRow").trigger('playPauseAll');
        */

        MixerUtil.enableOrDisableButtons([MixerUtil.btn.play], false);

        var inputNames=["trackDescription", "trackName", "trackTags"];

        for(var i = 0; i < inputNames.length; i++){
            $('#'+inputNames[i]+trackDto.uiId).change(function(){
                MixerUtil.notifyOfChanges(this.name + ' changed to: ' + this.value);
            });
        }

        if(isNewRecording) {
            MixerUtil.notifyOfChanges('Added new track');
        }

    };

    /**
     *
     */
    this.removeTrack = function(){
        log.trace("enter removeTrack");
    };

    /**
     *
     * @param userDto
     */
    this.addCollaborator = function(userDto){
        log.trace("enter addCollaborator");
    };

};//end SongMixer
