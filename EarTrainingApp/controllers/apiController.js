var Question = require('../models/question');
var Option = require('../models/option');
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
    const body_options = req.body["options[]"];

    if (!body_options) {
        res.status(404).send("No choice made.");
    } else if (typeof body_options === "string") {
        Option.findById(body_options, "feedback correct", function (err, docs) {
            if (err) {
                return next(err);
            } else {
                res.json([docs]);
            }
        });
    } else {
        const user_options = [];
        for (option of body_options) {
            user_options.push(mongoose.Types.ObjectId(option));
        }

        Option.find({ _id: { $in: user_options } }, "feedback correct", function (err, docs) {
            if (err) {
                return next(err);
            } else {
                res.json(docs);
            }
        });
    }
};