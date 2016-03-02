var crypto = require('crypto');
var DisqusUtil = module.exports = {};


/**
 * based on https://github.com/disqus/DISQUS-API-Recipes/blob/master/sso/javascript/main.js
 * @param userDto
 * @returns {{pubKey: *, auth: string}}
 */
DisqusUtil.getSignonKey = function(userDto) {
    var disqusData = {
        id: userDto.id,
        username: userDto.firstName,
        email: userDto.email,
        avatar: process.env.BASE_URL + '/uploads/users/profile/'+userDto.profilePic
    };

    var disqusStr = JSON.stringify(disqusData);
    var timestamp = Math.round(+new Date() / 1000);

    var message = new Buffer(disqusStr).toString('base64');

    /*
     * CryptoJS is required for hashing (included in dir)
     * https://code.google.com/p/crypto-js/
     */
    //var result = CryptoJS.HmacSHA1(message + " " + timestamp, process.env.DISQUS_SECRET);
    //var hexsig = CryptoJS.enc.Hex.stringify(result);

    var hash = crypto.createHmac('sha1', process.env.DISQUS_API_SECRET).update(message + " " + timestamp).digest('hex')

    return message + " " + hash + " " + timestamp;
};


