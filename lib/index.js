'use strict';

let co = require("co");
let request = require("co-request");
let moment = require('moment');
let _ = require('lodash');
let server = require('http').createServer();
server.listen(3000);
let io = require('socket.io')(server);

var config = require('../config');

let options = {
    auth: {
        user: config.credentials.username,
        pass: config.credentials.password
    }
};

let mailIdCache = [];

setInterval(() => {
    co(loadMailIds)
        .then(mailIds => _.difference(mailIds, mailIdCache))
        .then(newMailIds => {
            console.log(newMailIds);
            _.forEach(newMailIds, newMailId => {
                io.emit('New Mail Item', {id: newMailId});
                mailIdCache.push(newMailId);
            });
            return mailIdCache;
        })
        .catch(err => console.err(err));
}, 5 * 1000);


let loadMailIds = function * () {
    options.url = `https://zimbra.site.com/home/~/${config.folder}.json?query=after:${moment().subtract(1, 'days').format('MM/DD/YYYY')}`;
    let result = yield request(options);
    let body = result.body;
    let ids = Array.prototype.map.call(JSON.parse(body).m, (message => message.id));
    return ids;
};