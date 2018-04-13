var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ExerciseSessionSchema = new Schema(
    {
        user_id: {
            type: Schema.ObjectId,
            required: true,
            ref: 'User',
        },
        skill_id: {
            type: Schema.ObjectId,
            required: true,
            ref: 'Skill'
        },
        category: {
            type: String,
            required: true,
            enum: ['basic', 'intermediate', 'advanced'],
        },
        questions: {
            type: [Schema.ObjectId],
            ref: 'Question',
            required: true,
        },
        current_index: {
            type: Number,
            required: true,
        },
        current_attempt: {
            type: Number,
            required: true,
        },
        order_set: {
            type: Boolean,
            required: true,
        },
    }
);

//Export model
module.exports = mongoose.model('ExerciseSession', ExerciseSessionSchema);