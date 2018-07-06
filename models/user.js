var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: [1, 'Skill name is too short.'],
            max: [100, 'Skill name is too long.'],
        },
        email: {
            type: String,
            required: true,
            min: 1,
            max: 254,
        },
        user_id: {
            type: String,
            required: true,
            min: 1,
        },
        picture: {
            type: String,
            min: 1,
        },
        role: {
            type: String,
            required: true,
            enum: ['student', 'admin', 'instructor'],
        },
        token: {
            type: String,
            required: true,
        },
    }
);

//Export model
module.exports = mongoose.model('User', UserSchema);