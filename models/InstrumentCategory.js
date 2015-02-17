var keystone = require('keystone');

/**
 * InstrumentCategory Model
 * ==================
 */

var InstrumentCategory = new keystone.List('InstrumentCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

InstrumentCategory.add({
	name: { type: String, required: true }
});

InstrumentCategory.relationship({ ref: 'Instrument', path: 'category' });

InstrumentCategory.register();
