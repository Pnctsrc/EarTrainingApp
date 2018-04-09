var mongoose = require('mongoose');

var Schema = mongoose.Schema;

/*
    A skill can include sub-skills.
    Whenever a skill contains any sub-skill, it must not contain any question.
*/
var SkillSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: [1, 'Skill name is too short.'],
            max: [100, 'Skill name is too long.'],
        },
        requirements: {
            type: [Schema.ObjectId],
            ref: 'Skill',
        },
        description: {
            type: String,
            required: true,
            min: [1, 'Skill description is too short.'],
            max: [1000, 'Skill description is too long.'],
        },
        parent: {
            type: Schema.ObjectId,
            ref: 'Skill',
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
        },
        toObject: {
            virtuals: true
        }
    }
);

// Virtual for skill's URL
SkillSchema
    .virtual('url')
    .get(function () {
        return '/catalog/skill/' + this._id;
    });

// Virtual for the list of sub-skills
SkillSchema.virtual('sub_skills', {
    ref: 'Skill',
    localField: '_id',
    foreignField: 'parent',
});

//Export model
module.exports = mongoose.model('Skill', SkillSchema);