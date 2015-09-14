var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */

var countryOptions = new Array({value : "", label : "Choose A Country"},{value : "USA", label : "United States"});
var User = new keystone.List('User');

User.add({
	name: { type: Types.Name, required: true, index: true },
	facebookId: { type: Types.Text, hidden: true, required: false, index: false},
	email: { type: Types.Email, initial: true, required: true, index: true, unique: true },
	password: { type: Types.Text, initial: true, required: true },
    passwordResetToken: { type: Types.Text, initial: false, index: false},
    passwordResetTokenExpires: { type: Types.Text, initial: false, index: false},
    profilePic: { type: Types.Text, initial: false, index: false, default : 'undefined.jpg'},
	instruments: {type: Types.Relationship, ref : 'Instrument', many:true},
	country: {type: Types.Select, label: 'Country', options: countryOptions}
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }
	
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});


/**
 * Relationships
 */

User.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });


/**
 * Registration
 */

User.defaultColumns = 'name, email, isAdmin';
User.register();
