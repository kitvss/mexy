module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        users: String,
        initiator: String,
        status: Number
    });
    cbok(mongoose.model('contact', Schema));
}