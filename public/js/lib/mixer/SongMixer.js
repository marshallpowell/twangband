
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
        var formData = new FormData();
        var searchDto = new SearchCriteriaDto();
        searchDto.type = "USER_IDS";

        for(var i = 0; i < songDto.collaborators.length; i++){
            searchDto.userIds.push(songDto.collaborators[i].id);
        }

        for(var i = 0; i < songDto.tracks.length; i++){
            searchDto.userIds.push(songDto.tracks[i].creatorId);
        }

        searchDto.userIds.push(songDto.creatorId);

        formData.append("searchCriteria", JSON.stringify(searchDto));

        //TODO we should load in the collaborator info server side
        $.ajax({
            url: '/search',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function(data){
                log.debug('found collaborators: '+data);
                var musicians = {};
                $( data ).each(function( index ) {
                    log.debug("loading musician: " + JSON.stringify(this));
                    log.debug("parent.musicians: " + mixer.musicians);
                    MixerUtil.addCollaboratorToUi(this);
                    musicians[this.id]=this;

                });

                log.debug("musicians: " + JSON.stringify(mixer.musicians));
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


        for(var i = 0; i < this.currentSongDto.tracks.length; i++){

            var trackDto = this.currentSongDto.tracks[i];
            trackDto.trackMixer=null;
            if(!trackDto.removed) {

                trackDto.viewOrder = i;
                trackDto.name = document.getElementById('trackName' + trackDto.uiId).value;
                trackDto.description = document.getElementById('trackDescription' + trackDto.uiId).value;

                trackDto.tags = $('#trackTags' + trackDto.uiId).val();

                if (trackDto.blobData != undefined) {
                    log.debug("adding rack blobData: " + trackDto.blobData + " for trackDto.uiId: " + trackDto.uiId);
                    formData.append("newTrack_" + i, trackDto.blobData, "song.wav");
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

        if(this.soloTrack !=null){
            this.soloTrack.trackMixer.wavesurfer.playPause();
        }
        else{

            for(var i = 0; i < this.currentSongDto.tracks.length; i++){
                this.currentSongDto.tracks[i].trackMixer.wavesurfer.playPause();
            }
        }

        MixerUtil.enableOrDisableButtons([MixerUtil.btn.stop], false);
    };

    /**
     *
     */
    this.stopAll = function(){
        log.trace("enter playPauseAll");

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
            var fileName = mixer.currentSongDto.name + ".wav"
            log.debug("Saved mix!");
            log.debug("file: " + fileName);
            Recorder.forceDownload(blob, fileName);
        }, channelDataArray, bufferSize);

    }

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


       trackDto.trackMixer = new TrackMixer(this.audioContext);


        var creatorImage = "<img src='/uploads/users/profile/shadow.jpg' width='50' height='50' />";

        if (!isNewRecording) {
            creatorImage = "<img class='thumbnailSmall' src='/uploads/users/profile/" + this.musicians[trackDto.creatorId].profilePic + "' width='50' height='50' />&nbsp;";
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
        if (trackDto.tags) {
            for (var i = 0; i < trackDto.tags.length; i++) {

                trackTags += '<option value="'+trackDto.tags[i]+'" selected>'+trackDto.tags[i]+'</option>\n';
            }
        }

        trackInfo += "</div>" +
            "<div class='row'>" +
            "<a href='#' onclick='MixerUtil.toggleEditTrack(\"" + trackDto.uiId + "\");' ><span id='trackLabelIcon" + trackDto.uiId + "' class='glyphicon glyphicon-pencil'></span> Edit: <span id='trackLabel" + trackDto.uiId + "'>" + trackDto.name.substring(0, 15) + "...</span></a>" +

            "<div style='display:none'>" +
            " <div id='trackInfo" + trackDto.uiId + "'> " +
            "    <div class='form-group row'> " +
            "        <div class='col-sm-4'><label for='trackName" + trackDto.uiId + "'>Track Name</label></div> " +
            "        <div class='col-sm-8'><input type='text' class='form-control' name='Track Name' id='trackName" + trackDto.uiId + "' class='trackName' value='" + trackDto.name + "' name='trackName" + trackDto.uiId + "' placeholder='Enter a name for this track' onchange='MixerUtil.updateTrackLabel(this.value,\"" + trackDto.uiId + "\");'/></div> " +
            "        <div class='col-sm-4'><label for='trackDescription" + trackDto.uiId + "''>Description</label></div> " +
            "        <div class='col-sm-8'><textarea class='form-control' name='Track Description' id='trackDescription" + trackDto.uiId + "' placeholder='Enter a description for this track'>" + trackDto.description + "</textarea></div> " +
            "        <div class='col-sm-4'><label for='trackTags" + trackDto.uiId + "''>What type of intrument(s) is on this track?</label></div> " +
            "        <div class='col-sm-8'><select name='Track Tags" + trackDto.uiId + "' id='trackTags" + trackDto.uiId + "' multiple>"+trackTags+"</select></div> " +
            "    </div> " +
            "  </div> " +
            "</div> " +
            "<span id='volspan'><input type='range' class = 'volumeSlider' id='volume" + trackDto.uiId + "' min='0' max = '100' value='100' style='width:150px' oninput='mixer.adjustTrackVolume(\"" + trackDto.uiId + "\", this.value);'/></span>" +
            "</div>" +
            "</div>";

        var waveDivId = 'track_waveform'+trackDto.uiId;
        var trackUrl = '/uploads/'+trackDto.fileName;

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
            trackDto.trackMixer.initUrl(waveDivId, trackUrl);
        }

        //don't think i need to a master volume, we can just use individual track volume and the master volume will be the PC
       // trackDto.trackMixer.wavesurfer.backend.gainNode.disconnect(); -- this gave some odd results
        trackDto.trackMixer.wavesurfer.backend.gainNode.connect(this.masterGainNode);

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
