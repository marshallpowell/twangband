$(document).ready(function () {

    (function (tb, $, undefined) {

        var songSearchResultPartial = Handlebars.compile($("#songSearchResultPartial").html());
        var trackSearchResultPartial = Handlebars.compile($("#trackSearchResultPartial").html());

        var wavesurfers = [];
        var log = new Logger('DEBUG');

        tb.dialogs.search.addResults = function (showView, results, songDtos) {
            var context = {};

            for(var i = 0; i < results.length; i++){
                context.searchResult = results[i];

                if(showView === 'songs'){
                    $('#searchResults').append(songSearchResultPartial(context));
                }
                else{
                    $('#searchResults').append(trackSearchResultPartial(context));
                }

            }

            tb.dialogs.search.loadWavs(songDtos);

        };

        tb.dialogs.search.loadWavs = function(songDtos){
console.log('here');
            for(var i = 0; i < songDtos.length; i++){
                tb.dialogs.search.createWav(songDtos[i]);
            }
        };

        tb.dialogs.search.createWav = function(songDto){

//console.log(JSON(songDto));
            if(songDto.fileName){

                var container = document.querySelector('#wav_'+songDto.id);

                wavesurfers[songDto.id] = WaveSurfer.create({
                    container: container,
                    waveColor: '#1989D4',
                    progressColor: '#2BAD1D ',
                    scrollParent: false,
                    interact: false,
                    height: 75
                });


                wavesurfers[songDto.id].load(tb.CDN+'/'+songDto.fileName);
                wavesurfers[songDto.id].on('ready', (function(){
                    document.getElementById('wav_loading_'+songDto.id).remove();
                    wavesurfers[songDto.id].destroy();

                }));
                wavesurfers[songDto.id].on('destroy', (function(){
                    wavCanvas = container.querySelector('canvas');
                    width = wavCanvas.style.width;
                    wavCanvas.removeAttribute("style");
                    wavCanvas.style.width = width;
                    document.getElementById('wavImg_'+songDto.id).appendChild(wavCanvas);
                }));
                wavesurfers[songDto.id].on('error', (function(){
                    document.getElementById('wav_loading_'+songDto.id).remove();
                    wavesurfers[songDto.id].destroy();
                }));




            }
        };

    }(window.tb = window.tb || {}, jQuery));
});