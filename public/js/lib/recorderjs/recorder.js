(function(window){

  //var WORKER_PATH = '/js/lib/recorderjs/recorderWorker.js';
  var WORKER_PATH = '/js/lib/mixer/MicWorker.js';
  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    var recordingDto = cfg.recordingDto;
    var my = this;

    this.wsConnected=false;

    this.context = source.context;
      console.log("sample rate: " + this.context.sampleRate);
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 bufferLen, numChannels, numChannels);
    var worker = new Worker(config.workerPath || WORKER_PATH);

    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels,
        recordingDto: recordingDto,
        baseUrl : window.location.host
      }
    });

    var recording = false,
        currCallback;

    this.node.onaudioprocess = function(e){

      if (!recording) return;
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++){
          buffer.push(e.inputBuffer.getChannelData(channel));
      }
      worker.postMessage({
        command: 'record',
        buffer: buffer
      });
    };

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    };

    this.record = function(){
      recording = true;
    };

    this.stop = function(){

      recording = false;
    };

    this.hasConnection = function(){
          return this.wsConnected;
    };

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    };

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    };

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    };

      /**
       * New function which exports an ArrayBuffer instead of a blob like the original
       * @param cb callback function
       * @param type - type of encoding
       */
      this.exportWAVBufferArray = function(cb, type){
          currCallback = cb || config.callback;
          type = type || config.type || 'audio/wav';
          if (!currCallback) throw new Error('Callback not set');
          worker.postMessage({
              command: 'exportWAVArrayBuffer',
              type: type
          });
      };

      this.waitForConnection = function(){
          worker.postMessage({
              command: 'waitForConnection'
          });
      };

      /**
       * New function which exports an ArrayBuffer instead of a blob like the original
       * @param cb callback function
       * @param type - type of encoding
       */
      this.endRecording = function(cb, type){

          console.log("enter endRecording");
          this.stop();
          currCallback = cb;
          type = type || config.type || 'audio/wav';
          if (!currCallback) throw new Error('Callback not set');
          worker.postMessage({
              command: 'endRecording',
              type: type
          });
      };
    /**
     *
     * @param cb
     * @param type
     * @param buffers
     * @param totalLength
     */
    this.exportWavFromBuffers = function(cb, buffers, totalLength){
      currCallback = cb || config.callback;
      var type = config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWavFromBuffers',
        type: type,
        buffers : buffers,
        totalLength : totalLength
      });
    };

    worker.onmessage = function(e){

        switch(e.data.command){
            case 'waitForWebSocketResponse':
                $('#savingModal').modal('show');
                worker.postMessage({command: 'waitForWebSocketResponse'});
                break;
            case 'waitForConnection':
                worker.postMessage({command: 'waitForConnection'});
                break;
            case 'hasConnection':
                console.log('connection is up');
                my.wsConnected=true;
                break;
            case 'errorConnecting':
                this.wsConnected=false;
                console.log('there was an error connecting to the server');
                alert('there was an error connecting to the server');
                break;
            default:
                $('#savingModal').modal('hide');
                var blob = e.data;
                currCallback(blob);
        }

    };

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  };

  window.Recorder = Recorder;

})(window);
