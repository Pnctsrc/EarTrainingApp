var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReportSchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        question_id: {
            type: Schema.ObjectId,
            required: true,
            ref: 'Question',
        },
        user_id: {
            type: Schema.ObjectId,
            required: true,
            ref: 'User',
        },
        type: {
            type: String,
            required: true,
            enum: ['exercise', 'class'],
        },
        attempts_until_correct: {
            type: Number,
            required: true,
        },
        attempts_until_perfect: {
            type: Number,
            required: true,
        },
        skips_before_try: {
            type: Boolean,
            required: true,
        },
        skips_before_correct: {
            type: Number,
            required: true,
        },
        skips_before_perfect: {
            type: Number,
            required: true,
        },
        current_attempt: {
            type: Number,
            required: true,
        },
    }
);

//Export model
module.exports = mongoose.model('Report', ReportSchema);