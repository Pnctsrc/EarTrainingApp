var Question = require('../models/question');
var Skill = require('../models/skill');
var Class = require('../models/class');
var Enrollment = require('../models/enrollment');

var mongoose = require('mongoose');
var async = require('async');

exports.class_enrollment_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_enrollment_post = function (req, res) {
    const class_id = mongoose.Types.ObjectId(req.body.class_id);

    Class.findById(class_id, function (err, class_doc) {
        if (err) {
            next(err);
        } else {
            if (!class_doc) {
                res.status(400);
                res.json({ message: "Class not found." });
            } else {
                const new_enrollment = new Enrollment({
                    class: class_id,
                    student: res.locals.user_id,
                    date: new Date(),
                })

                new_enrollment.save(function (err) {
                    if (err) {
                        res.status(400);
                        res.json({ message: err.message });
                    } else {
                        res.json({ message: "success." });
                    }
                })
            }
        }
    })
}

exports.class_create_post = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_edit_post = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_list_get = function (req, res, next) {
    const user_id = res.locals.user_id;

    async.waterfall([
        function (callback) {
            Enrollment.find({ student: user_id }, 'class', function (err, enrollment_list) {
                if (err) {
                    callback(err, null);
                } else {
                    const enrollment_id_list = [];
                    for (var enrollment of enrollment_list) {
                        enrollment_id_list.push(enrollment.class);
                    }
                    callback(null, enrollment_id_list);
                }
            })
        },
        function (enrollment_id_list, callback) {
            Class.find({ _id: { $in: enrollment_id_list } }, 'name description', function (err, class_list) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, class_list);
                }
            })
        }
    ], function (err, class_list) {
        if (err) {
            next(err);
        } else {
            res.render('class_list', { title: "Class list", class_list: class_list });
        }
    })
}

exports.class_create_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_edit_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_assignment_list_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

exports.class_assignment_get = function (req, res, next) {
    res.json({ err: "Not implemented." });
}

