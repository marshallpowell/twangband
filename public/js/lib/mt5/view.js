// Amine Hallili
// Creation de l'objet interface pour simplifier le code et le rendre facilement maintenable
// cette classe ne doit contenir que le traitement lié directement à l'interface graphique
// cette classe ne contient pas forcement tout les elements de la page mais ceux qui vont surement etre utilisés dans le code
function View() {
    // all html elements [element=id]
    this.masterCanvas = "myCanvas"; // the canvas where we draw the track wave
    this.masterCanvasContext;
    this.frontCanvas = "frontCanvas"; // the canvas where we draw the time
    this.frontCanvasContext;
    this.waveCanvas = "waveCanvas"; //the canvas where we draw the animation wave of the song
    this.waveCanvasContext;
    this.songs = "songs"; //choice list of all the songs
    this.knobMasterVolume = "masterVolume"; // the canvas representing the master volume slider
    this.mute = "bsound"; // button to mute unmute the current song volume
    this.play = "bplay";
    this.pause = "bpause";
    this.stop = "bstop";
    this.startLoop = "loopStart";
    this.endLoop = "loopEnd";
    this.replayLoop = "loopReset"
    this.enableLoop = "loopOnOff";
    this.tracks = "tracks"; // List of tracks and mute buttons
    this.console = "messages";
    this.consoleTab = "consoleTab";
    this.waveTab = "waveTab";

    // getting all the html elements when the page completly loads
    this.init = function () {
        this.masterCanvas = document.getElementById("myCanvas");
        this.masterCanvasContext = this.masterCanvas.getContext('2d');
        this.frontCanvas = document.getElementById("frontCanvas");
        this.frontCanvasContext = this.frontCanvas.getContext('2d');

        // make it same size as its brother
        this.frontCanvas.height = window.View.masterCanvas.height;
        this.frontCanvas.width = window.View.masterCanvas.width;

        this.waveCanvas = document.getElementById("waveCanvas");
        this.waveCanvasContext = this.waveCanvas.getContext('2d');
        this.songs = document.getElementById("songs");
        this.knobMasterVolume = document.getElementById("masterVolume");
        this.mute = document.getElementById("bsound");
        this.play = document.getElementById("bplay");
        this.pause = document.getElementById("bpause");
        this.stop = document.getElementById("bstop");
        this.startLoop = document.getElementById("loopStart");
        this.endLoop = document.getElementById("loopEnd");
        this.replayLoop = document.getElementById("loopReset");
        this.enableLoop = document.getElementById("loopOnOff");
        this.tracks = document.getElementById("tracks");
        this.console = document.getElementById("messages");
        this.consoleTab = document.getElementById("consoleTab");
        this.waveTab = document.getElementById("waveTab");
    }

    // print the controls of a song's track (name,mute,solo and progress bar)
    this.appendTrack = function (trackNumber, instrumentName, SAMPLE_HEIGHT) {
        var tr = document.createElement("tr");

        tr.innerHTML = '<td class="trackBox" style="height : ' + SAMPLE_HEIGHT + 'px">' +
            "<progress class='pisteProgress' id='progress" + trackNumber + "' value='0' max='100' style='width : " + SAMPLE_HEIGHT + "px' ></progress>" +
            instrumentName + '<div style="float : right;">' +
            "<button class='mute' id='mute" + trackNumber + "' onclick='muteUnmuteTrack(" + trackNumber + ");'><span class='glyphicon glyphicon-volume-up'></span></button> " +
            "<button class='solo' id='solo" + trackNumber + "' onclick='soloNosoloTrack(" + trackNumber + ");'><img src='../img/earphones.png' /></button></div>" +
            "<span id='volspan'><input type='range' class = 'volumeSlider' id='volume" + trackNumber + "' min='0' max = '100' value='100' onchange='setVolumeOfTrackDependingOnSliderValue(" + trackNumber + ");'/></span><td>";

        this.tracks.appendChild(tr);
    }

    // adding a message in the console
    this.addMessage = function (message) {
        this.console.innerHTML = this.console.innerHTML + "<br />" + message;
    }

    this.activeConsoleTab = function () {
        $(this.consoleTab).click();
    }

    this.activeWaveTab = function () {
        $(this.waveTab).click();
    }
}
