var Question = require('../models/question');
var Skill = require('../models/skill');
var Report = require('../models/report');
var ReportDate = require('../models/report_date');

var mongoose = require('mongoose');
var async = require('async');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;

exports.report_get = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .populate("sub_skills")
        .exec(function (err, skill_list) {
            if (err) { return next(err); }
            var sorted_list = [];

            for (let skill of skill_list) {
                if (!skill.parent) {
                    fetch_skill_levels(skill, 0, skill_list, sorted_list);
                }
            }

            res.render('report', { title: 'User Report', skill_list: sorted_list });
        });
}

exports.report_data_post = function (req, res, next) {
    const skill_id = mongoose.Types.ObjectId(req.body.skill_id);
    const difficulty = "" + req.body.difficulty;
    const year = Number(req.body.year);
    const month = Number(req.body.month);

    async.waterfall([
        function (callback) {
            Skill.findById(skill_id, function (err, skill_doc) {
                if (err) {
                    callback(err, null);
                } else if (!skill_doc) {
                    callback({
                        message: "Skill not found.",
                        status: 404,
                    }, null);
                } else {
                    callback(null, skill_doc);
                }
            })
        },
        function (skill_doc, callback) {
            Question.find({ skill: skill_id, difficulty: difficulty }, function (err, question_list) {
                if (err) {
                    callback(err, null);
                } else if (question_list.length == 0) {
                    callback({
                        message: "No questions found.",
                        status: 404,
                    }, null);
                } else {
                    const question_id_list = [];
                    for (let question of question_list) {
                        question_id_list.push(question._id.toString());
                    }
                    callback(null, question_id_list);
                }
            })
        },
        function (question_id_list, callback) {
            const start_date = new Date(`${year}-${month}-1`);
            const end_date = new Date(`${year}-${month}-31`);

            Report.find({
                question_id: { $in: question_id_list },
                type: "exercise",
                date: { $gte: start_date, $lte: end_date },
            }, "-user_id -question_id -__v -id -_id")
                .exec(function (err, report_list) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, report_list);
                    }
            })
        },
    ], function (err, report_list) {
        if (err) {
            next(err);
        } else {
            res.json(report_list);
        }
    })
}

exports.report_overview_post = function (req, res, next) {
    const user_id = res.locals.user_id;

    ReportDate.find({ user_id: user_id })
        .populate("question", "_id skill difficulty")
        .exec(function (err, report_list) {
            if (err) {
                next(err);
            } else if (report_list.length == 0) {
                next({
                    message: "Record not found",
                    status: 404,
                })
            } else {
                res.json(report_list);
            }
        })
}