var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReportDateSchema = new Schema(
    {
        user_id: {
            type: Schema.ObjectId,
            required: true,
            ref: 'User',
        },
        question: {
            type: Schema.ObjectId,
            required: true,
            ref: 'Question',
        },
        year: {
            type: Number,
            required: true,
        },
        month: {
            type: Number,
            required: true,
        },
    }
);

//Export model
module.exports = mongoose.model('ReportDate', ReportDateSchema);