var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Instrument Model
 * ==========
 */

var Instrument = new keystone.List('Instrument', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'name', unique: true }
});

Instrument.add({
	name: { type: String, required: true },
	category: { type: Types.Relationship, ref: 'InstrumentCategory'}
});

Instrument.defaultColumns = 'name|50%, category|50%';
Instrument.register();
