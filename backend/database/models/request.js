module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        initiator: String,
        type: String,
        target: String,
        status: Number,
    });
    cbok(mongoose.model('request', Schema));
}