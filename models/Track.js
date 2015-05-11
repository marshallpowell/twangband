/**
 * Created by mpowell on 4/16/2015.
 */

/*
 {"newTrack_0":{"fieldname":"newTrack_0","originalname":"song.wav","name":"04672459aabed00af9b021b822c9f13.wav","encoding":"7bit","mimetype":"audio/wav","path"
 :"/tmp/046792459aabed00af9b021b822c9f13.wav","extension":"wav","size":147500,"truncated":false,"buffer":null}
 */

var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * Song Track Model
 * ==========
 */


var Track = new keystone.List('Track');

Track.add({
    name: { type: String, required: true, index: true },
    fileName: { type: String, required: true, initial: false},
    creator: { type: Types.Relationship, ref: 'User', required: true, initial: false, index: true},
    mimetype: { type: String, required: true, initial: false},
    encoding: { type: String, required: true, initial: false},
    size: { type: Number, required: true, initial: false},
    dateCreated: { type: Types.Datetime, default: Date.now },
    isPublic: {type: Types.Boolean, default: true}

}, 'Permissions', {
    isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }

});

// Provide access to Keystone
Track.schema.virtual('canAccessKeystone').get(function() {
    return this.isAdmin;
});


/**
 * Relationships
 */

//Song.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });


/**
 * Registration
 */

Track.register();

