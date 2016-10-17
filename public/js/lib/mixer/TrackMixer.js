var TrackMixer = function(id, audioContext){

    var my = this;
    this.audioContext = audioContext;
    this.wavesurfer = null;
    this.volume=1;
    this.id='track_waveform'+id;
    this.messageId=this.id+'_message';

    this.setVolume=function(vol){
        this.volume = vol;
        this.wavesurfer.setVolume(this.volume);
    };

    /**
     * Loads a URL into wavesurfer
     * @param url
     * @returns {TrackMixer}
     */
    this.initUrl = function(url){

        this.createWaveSurfer(my.id);
        this.wavesurfer.load(url);

        return this;
    };

    /**
     * Loads a blob into wavesurfer
     * @param blob
     * @returns {TrackMixer}
     */
    this.initBlob = function(blob){

        this.createWaveSurfer(my.id);

        this.wavesurfer.loadBlob(blob);

        return this;
    };

    this.showLoadingMessage = function(){
        //my.wavesurfer.container.innerHTML +='<p id="'+my.messageId+'"><span class="fa fa-spinner fa-pulse"></span> Loading...</p>';
    };

    this.removeLoadingMessage = function(){
        document.getElementById(my.messageId).remove();
    };

    this.createWaveSurfer=function(id){
        this.wavesurfer = WaveSurfer.create({
            container: document.querySelector('#'+id),
            minPxPerSec: 30,
            scrollParent: true,
            autoCenter:false,
            height:76,
            waveColor: '#1989D4',
            progressColor: '#2BAD1D ',
            hideScrollbar: true,
            //barWidth: 1,
            //pixelRatio: 1,
            audioContext: my.audioContext
        });

        //this.wavesurfer.on('loading', this.showLoadingMessage);
        this.wavesurfer.on('ready', this.removeLoadingMessage);
        this.wavesurfer.on('destroy', this.removeLoadingMessage);
        this.wavesurfer.on('error', this.removeLoadingMessage);

        this.wavesurfer.setVolume(this.volume);

    }

};
