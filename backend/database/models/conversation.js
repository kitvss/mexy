module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        users: String,
    });
    cbok(mongoose.model('conversation', Schema));
}