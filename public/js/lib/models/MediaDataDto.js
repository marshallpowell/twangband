var method = MediaDataDto.prototype;

function MediaDataDto(){

    var fileName;
    var formatName;
    var duration;
    var size;
    var bitRate;

    //stream info
    var codecName;
    var codecType;
    var sampleFormat;
    var sampleRate;
    var numberOfChannels;
    var channelLayout;
    var bitsPerSample;

    /*
     "streams": [
     {
     "index": 0,
     "codec_name": "vorbis",
     "codec_type": "audio",
     "codec_time_base": "1/44100",
     "codec_tag_string": "[0][0][0][0]",
     "codec_tag": "0x0000",
     "sample_fmt": "fltp",
     "sample_rate": "44100",
     "channels": 2,
     "channel_layout": "stereo",
     "bits_per_sample": 0,
     "r_frame_rate": "0/0",
     "avg_frame_rate": "0/0",
     "time_base": "1/44100",
     "start_pts": 0,
     "start_time": "0.000000",
     "duration_ts": 69632,
     "duration": "1.578957",
     "bit_rate": "112000",
     "disposition": {
     "default": 0,
     "dub": 0,
     "original": 0,
     "comment": 0,
     "lyrics": 0,
     "karaoke": 0,
     "forced": 0,
     "hearing_impaired": 0,
     "visual_impaired": 0,
     "clean_effects": 0,
     "attached_pic": 0
     },
     "tags": {
     "ENCODER": "Lavc56.60.100 libvorbis"
     }
     }
     ],
     "format": {
     "filename": "/tmp/workdir/uploads/5f6ff1be6bedc781da48bc7d8ec8be21.ogg",
     "nb_streams": 1,
     "nb_programs": 0,
     "format_name": "ogg",
     "start_time": "0.000000",
     "duration": "1.578957",
     "size": "20684",
     "bit_rate": "104798",
     "probe_score": 100
     },
     "name": "5f6ff1be6bedc781da48bc7d8ec8be21.ogg"
     */

}

try{module.exports = MediaDataDto;} catch(err){}