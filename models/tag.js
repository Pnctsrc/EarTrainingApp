var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TagSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: 1,
        },
        count: {
            type: Number,
            required: true,
        }
    },
);

//Export model
module.exports = mongoose.model('Tag', TagSchema);