var mongoose = require('mongoose');
var api = {
    models: {}
};

var fn = function(cb) {
    var config = require('../../config');
    mongoose.connect('mongodb://' + config.db.url + config.db.name);
    var db = mongoose.connection;

    api.mongoose = mongoose;

    var models = [
        'user',
        'registration_email',
        'restore_email',
        'settings',
        'user_data',
        'contact',
        'conversation',
        'message',
    ];

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function() {
        var total = models.length, ready = 0;
        models.forEach(name => {
            require('./models/' + name)(mongoose, fail => {
                console.log('cannot require mongo model',name);
            }, ok => {
                api.models[name] = ok;
                require('./api_for_' + name)(api, fail => {
                    // 
                }, ok => {
                    ready++;
                    if(ready == total){
                        cb(api);
                    }
                });
            });
        })
    });
}

fn.api = api;

module.exports = fn;