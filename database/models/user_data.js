module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        uid: String,
        prop: String,
        val: String,
    });
    cbok(mongoose.model('user_data', Schema));
}