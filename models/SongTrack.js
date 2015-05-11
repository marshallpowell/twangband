var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * SongTrack Model
 * ==========
 */

var SongTrack = new keystone.List('SongTrack');

SongTrack.add({
    name: { type: String, required: true, index: true, initial: false },
    volume: { type: Number, default: 5},
    gain: { type: Number, default: 0},
    position: { type: Number, default: 0},
    muted: { type: Boolean, default: false},
    creator: { type: Types.Relationship, ref: 'User', index: true },
    fileName: {type: String, required: true, index: true, initial: false},
    dateCreated: { type: Types.Datetime, default: Date.now }
}, 'Permissions', {
    isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }

});

// Provide access to Keystone
SongTrack.schema.virtual('canAccessKeystone').get(function() {
    return this.isAdmin;
});


/**
 * Relationships
 */

//Song.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });


/**
 * Registration
 */

SongTrack.register();

/**
 * Created by mpowell on 4/24/2015.
 */
