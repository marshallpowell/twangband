var TrackMixer = function(){

    this.wavesurfer = null;

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
            waveColor: '#A8DBA8',
            progressColor: '#EEEECC',
            hideScrollbar: true,
            barWidth: 1,
            pixelRatio: 1
        });
    }

}
