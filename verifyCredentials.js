const request = require('request');

module.exports = verify;

function verify(credentials, callback) {
    callback(null, true);
}
