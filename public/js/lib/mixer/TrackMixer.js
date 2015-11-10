var TrackMixer = function(audioContext){

    var my = this;
    this.audioContext = audioContext;
    this.wavesurfer = null;
    this.volume=1;

    this.setVolume=function(vol){
        this.volume = vol;
        this.wavesurfer.setVolume(this.volume);
    }

    /**
     * Loads a URL into wavesurfer
     * @param id
     * @param url
     * @returns {TrackMixer}
     */
    this.initUrl = function(id, url){

        this.createWaveSurfer(id)
        this.wavesurfer.load(url);

        return this;
    };

    /**
     * Loads a blob into wavesurfer
     * @param id
     * @param blob
     * @returns {TrackMixer}
     */
    this.initBlob = function(id, blob){

        this.createWaveSurfer(id)

        this.wavesurfer.loadBlob(blob);

        return this;
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
            barWidth: 1,
            pixelRatio: 1,
            audioContext: my.audioContext
        });

        this.wavesurfer.setVolume(this.volume);
    }

}
