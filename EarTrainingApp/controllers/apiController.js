var Question = require('../models/question');
var mongoose = require('mongoose');

// Get the list of all questions for a specific level of a skill
exports.questions_list = function (req, res, next) {
    var skill_id = mongoose.Types.ObjectId(req.body.skill);
    var question_level = req.body.level;

    Question.find({ difficulty: question_level, skill: skill_id })
        .populate('options')
        .populate('skill')
        .exec(function (err, questions) {
            if (err) return next(err);

            if (questions) {
                res.json(questions);
            } else {
                res.status(404).send("This level has no questions yet.");
            }
        })
};

// Check the answer and feedback of a question
exports.question_answer = function (req, res, next) {
    console.log(req.body);
};