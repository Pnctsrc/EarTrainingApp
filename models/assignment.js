var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AssignmentSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: 1,
        },
        description: {
            type: String,
        },
        content: [{
            skill: {
                type: Schema.ObjectId,
                ref: 'Skill',
                required: true,
            },
            tags: {
                type: [Schema.ObjectId],
                ref: 'Tag'
            },
            if_instructor_only: {
                type: Boolean,
                required: true
            }
        }],
        creator: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        class: {
            type: Schema.ObjectId,
            ref: 'Class',
            required: true,
        }
    },
);

// Virtual for question's URL
AssignmentSchema
    .virtual('url')
    .get(function () {
        return '/class/assignment/' + this._id;
    });

//Export model
module.exports = mongoose.model('Assignment', AssignmentSchema);