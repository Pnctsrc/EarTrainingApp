var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var OptionSchema = new Schema(
    {
        category: {
            type: String,
            enum: ['audio', 'picture', 'text'],
            required: true,
        },
        audio: {
            type: String,
            required: function () {
                return this.category === 'audio';
            },
        },
        picture: {
            type: String,
            required: function () {
                return this.category === 'picture';
            }
        },
        text: {
            type: String,
            required: function () {
                return this.category === 'text';
            },
        },
        question: {
            type: Schema.ObjectId,
            ref: 'Question',
            required: true,
        },
        correct: {
            type: Boolean,
            required: true,
        },
        feedback: {
            type: String,
            required: function () {
                return !this.correct;
            }
        }
    }
);

//Export model
module.exports = mongoose.model('Option', OptionSchema);