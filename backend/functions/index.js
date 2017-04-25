var api = {
}

var mctx = {
    api: api
},
    list = [
        'mailing',
        'online_users',
        'conversation',
        'temp_files',
        'cloudinary',
    ];

var total = list.length;
var ready = 0;

list.forEach(name => {
    try {
        require('./api_for_' + name)(mctx, fail => {
            console.log('Function api failed for', name, ':', fail);
        }, ok => {
            ready++;
            if (ready == total) {
                console.log('Functions API ready');
            }
        });
    } catch (err) {
        console.log(err);
    }
});

module.exports = api;