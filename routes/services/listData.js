var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var tagDao = require(APP_LIB + 'dao/TagDao');

exports = module.exports = function(req, res) {

    logger.debug("****************************************enter lists with type: " + req.query.type);
    var listData = [];

    var listType = req.query.type;

    if (listType == 'instruments') {

        listData = tagDao.getInstruments();
        res.json(listData);

    }
};