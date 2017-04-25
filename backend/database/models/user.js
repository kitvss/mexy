module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        name: String,
        email: String,
        login: String,
        login_lower: String,
        password: String,
        active: Boolean,
        last_v: Date,
    });
    cbok(mongoose.model('user', Schema));
}