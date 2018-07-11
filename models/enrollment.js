var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var EnrollmentSchema = new Schema(
    {
        class: {
            type: Schema.ObjectId,
            ref: 'Class',
            required: true,
        },
        student: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
    },
);

//Export model
module.exports = mongoose.model('Enrollment', EnrollmentSchema);