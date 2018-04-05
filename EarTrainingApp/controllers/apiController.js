var Question = require('../models/question');
var Option = require('../models/option');
var mongoose = require('mongoose');

var async = require('async');

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
    } else {
        const question_id = mongoose.Types.ObjectId(req.body.question);
        const user_options = [];

        if (typeof body_options === "string") {
            user_options.push(body_options)
        } else {
            for (option of body_options) {
                user_options.push(mongoose.Types.ObjectId(option));
            }
        }

        async.series({
            docs: function (callback) {
                Option.find({ _id: { $in: user_options } }, "feedback correct", function (err, docs) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, docs)
                    }
                });
            },
            count: function (callback) {
                Option.count({ question: question_id, correct: true }, function (err, count) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, count);
                    }
                })
            }
        }, function (err, results) {
            if (err) {
                return next(err);
            } else {
                var correct_answers = 0;
                for (var option of results.docs) {
                    if (option.correct) correct_answers++;
                }

                const result = {
                    list: results.docs
                }

                if (correct_answers != results.count && results.count > 1) {
                    result.not_all = true;
                }

                res.json(result);
            }
        })
    }
};