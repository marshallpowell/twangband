/**
 * Created by mpowell on 4/27/2015.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongTrackSchema = new Schema ({
    name: { type: String, required: true, index: true, initial: false },
    volume: { type: Number, default: 5},
    gain: { type: Number, default: 0},
    position: { type: Number, default: 0},
    muted: { type: Boolean, default: false},
    fileName: {type: String, required: true, index: true, initial: false},
    dateCreated: { type: Date, default: Date.now }
});

var SongSchema = new Schema({
    name: { type: String, required: true, index: true, initial: false },
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    songTracks:   [SongTrackSchema],
    dateCreated: { type: Date, default: Date.now },
    deleted: Boolean

});