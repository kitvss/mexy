module.exports = function (mongoose, cbfail, cbok) {
    var Schema = mongoose.Schema({
        cid: String,
        sender: String,
        data: String,
        viewed: Boolean,
        deleted_by: Array,
        time: Date
    });
    cbok(mongoose.model('message', Schema));
}