var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var QuestionSchema = new Schema(
    {
        difficulty: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced'],
            required: true,
        },
        html: {
            type: String,
            required: true,
            min: [1, 'Question text is too short.'],
            max: [5000, 'Question text is too long.'],
        },
        skill: {
            type: Schema.ObjectId,
            ref: 'Skill',
            required: true,
        },
        attempts: {
            type: String,
            required: true,
            enum: ['unlimited', '3', '4', '5']
        },
        creator: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        toJSON: {
            virtuals: true
        }
    }
);

// Virtual for question's URL
QuestionSchema
    .virtual('url')
    .get(function () {
        return '/catalog/question/' + this._id;
    });

// Virtual for the list of options for this question
QuestionSchema.virtual('options', {
    ref: 'Option',
    localField: '_id',
    foreignField: 'question',
});

//Export model
module.exports = mongoose.model('Question', QuestionSchema);