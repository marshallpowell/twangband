
var SongMixer = function(songDto){

    log.trace("enter SongMixer");

    var mixer = this; //use in ajax call backs

    this.trackRowTemplate = Handlebars.compile($("#mixerTrackRowPartial").html());
    this.newEdits=[];
    //the current song that was loaded
    this.currentSongDto;
    //array of users who created tracks here
    this.musicians={};

    this.masterGainNode;
    this.audioContext = tb.audioContext; //new (window.AudioContext || window.webkitAudioContext)();

    /**
     * Init
     */
    this.init = function() {

        log.trace("enter init");

        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);

        //MixerUtil.enableOrDisableButtons(MixerUtil.buttonsIds, true);

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

                //add creator icon
                var template = Handlebars.compile($("#musicianInfoIconPartial").html());
                var context={}
                context.userDto = mixer.musicians[songDto.creatorId];
                $('#songCreatorName').html('by '+mixer.musicians[songDto.creatorId].firstName);
                $('#songCreatorIcon').html(template(context));
            });

            //disable any admin features
            //TODO this should go under MixerUtil and be more generic
            if(songDto.creatorId != user.id){

                var options = document.getElementsByClassName('adminOption');

                for(var i = 0; i < options.length; i++){
                    options[i].style.display='none';
                }

            }


        }
        else {
            log.debug("create a new SongDto");
            //MixerUtil.enableOrDisableButtons(MixerUtil.buttonsIds, true);
            //MixerUtil.enableOrDisableButtons([MixerUtil.btn.saveSong,MixerUtil.btn.record,MixerUtil.btn.searchCollaborators], false);
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
            searchDto.userIds.push(songDto.tracks[i].originalTrackDto.creatorId);
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
    this.saveSong = function(notificationDiv){

        log.trace("enter save");

        if(!MixerUtil.validateRoleAndNotify(AppConstants.ROLES.ADMIN)){
            return;
        }

        var formData = new FormData();

        for(var i = 0; i < this.currentSongDto.tracks.length; i++){

            var songTrackDto = Object.create(this.currentSongDto.tracks[i]);
            songTrackDto.trackMixer=null;
            if(!songTrackDto.removed || songTrackDto.originalTrackDto !== undefined) {

                songTrackDto.viewOrder = i;
                //TODO save track volume, effects etc info

            }
        }

        formData.append("song", JSON.stringify(this.currentSongDto));

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

                    if(notificationDiv){
                        NotificationUtil.error(data.error, true, notificationDiv);
                    }
                    else{
                        $('#notificationBody').html("There was an error saving your song: " + data.error);
                    }

                    return;
                }
                console.log("saved song: " + JSON.stringify(data));
                document.getElementById('songDto').value = JSON.stringify(data);

                $('#savingModal').modal('toggle');

                if(notificationDiv){
                    NotificationUtil.success('Changes saved successfully', true, notificationDiv);
                }
                else{
                    $.notify('Changes saved successfully', 'success');
                }



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

            //don't play tracks that are set for removal
            var playTracks = [];
            for(var i = 0; i < this.currentSongDto.tracks.length; i++){
                if(!this.currentSongDto.tracks[i].removed){
                    playTracks.push(this.currentSongDto.tracks[i])
                }
            }


            for(var i = 0; i < playTracks.length; i++){
                playTracks[i].trackMixer.wavesurfer.playPause();
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


    this.toggleActiveClass = function(cssSelector){

        log.trace("enter toggleActiveClass");
       // $(el).toggleClass("activated");

        if(cssSelector){
            $(cssSelector).toggleClass("activated");
        }
    };
    /**
     *
     * @param el - the html element which called the function
     * @param uiId - uiId of the track
     * @param cssSelector - option css class to apply behavior to
     */
    this.toggleMuteTrack = function(el, uiId, cssSelector){

        log.trace("enter toggleMuteSong");
        this.getTrackByUiId(uiId).trackMixer.wavesurfer.toggleMute();
        this.toggleActiveClass(cssSelector);
    };

    this.toggleSoloTrack = function(el, uiId, cssSelector){

        log.trace("enter toggleSoloTrack");
        this.toggleActiveClass(cssSelector);
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
        trackDto.volume = volume/100;
        trackDto.trackMixer.wavesurfer.setVolume(trackDto.volume);
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
     * adds new track that has been saved on server and compressed
     * @param trackDto
     */
    this.addNewTrack = function(songTrackDto){

        this.addTrack(songTrackDto, false);
        this.currentSongDto.tracks.push(songTrackDto);
        //add notification to remix / save after track is added.
       // $.notify({title: 'You must save', button: "<span class='data-notify-html'>Click <a href='#'>save</a> to remix with new tracks</span>"},{ autoHide:false});
        MixerUtil.displaySaveNotification('Click save to mix this track into song.');

    };


    /**
     *
     */
    this.addTrack = function(trackDto, isNewRecording){

        log.trace("enter addTrack");

        log.debug("adding track: " + JSON.stringify(trackDto));
        //log.debug("adding original track: " + JSON.stringify(trackDto.originalTrackDto));
        log.debug('fileName: ' + trackDto.originalTrackDto.fileName);

       trackDto.trackMixer = new TrackMixer(trackDto.uiId, this.audioContext);

        var context = {};
        context.trackDto = trackDto.originalTrackDto;
        context.userDto = this.musicians[trackDto.originalTrackDto.creatorId];
        //context.trackTags = trackTags;
        context.readOnly = (trackDto.originalTrackDto.creatorId != user.id);
        var newTrackRow = this.trackRowTemplate(context);
        $("#scroll").append(newTrackRow);



        $('#trackTags'+trackDto.uiId).tagsinput({
            typeaheadjs: {
                name: 'instruments',
                displayKey: 'name',
                valueKey: 'name',
                source: tags.ttAdapter()
            }
        });

        if(isNewRecording){
            trackDto.trackMixer.initBlob(trackDto.blobData);
        }
        else{
            trackDto.trackMixer.initUrl(tb.CDN+'/'+trackDto.originalTrackDto.fileName);
        }

        //don't think i need to a master volume, we can just use individual track volume and the master volume will be the PC
       // trackDto.trackMixer.wavesurfer.backend.gainNode.disconnect(); -- this gave some odd results
        trackDto.trackMixer.wavesurfer.backend.gainNode.connect(this.masterGainNode);
        trackDto.trackMixer.wavesurfer.setVolume(trackDto.volume);
        log.debug('setting volume to: '+(trackDto.volume * 100) + ' dto volume: ' + trackDto.volume);
        document.getElementById('volume'+trackDto.uiId).value= (trackDto.volume * 100);


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



};//end SongMixer
