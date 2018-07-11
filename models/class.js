var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ClassSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: 1
        },
        description: {
            type: String,
            required: true,
            min: 1
        },
        creator: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
    },
);

// Virtual for question's URL
QuestionSchema
    .virtual('url')
    .get(function () {
        return '/class/' + this._id;
    });

//Export model
module.exports = mongoose.model('Class', ClassSchema);