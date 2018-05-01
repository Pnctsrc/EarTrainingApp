var Question = require('../models/question');
var Option = require('../models/option');
var Skill = require('../models/skill');
var ExerciseSession = require('../models/exercise_session');
var Report = require('../models/report');
var ReportDate = require('../models/report_date');


var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');

var fetch_skill_levels = require('../utils/skill_util').fetch_skill_levels;

const question_images_path = "./public/question_images/";
const question_audio_path = "./public/question_audio/";

var AWS = require('aws-sdk');
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.AWS_IDENTITY_POOL_ID,
});

exports.update_session = function (req, res, next) {
    const questions = req.body['questions[]'];
    const session_id = mongoose.Types.ObjectId(req.body.session_id);

    async.waterfall([
        function (callback) {
            ExerciseSession.findById(session_id, function (err, session) {
                const order_set = session.order_set;
                if (err) {
                    callback(err, null, null);
                } else {
                    if (session.user_id.toString() != res.locals.user_id.toString()) {
                        callback({
                            status: 400,
                            message: "Not the same user."
                        }, null, null, null);
                        return;
                    } 

                    if (questions) {
                        if (questions.length == 0) {
                            callback({
                                status: 400,
                                message: "Empty question list."
                            }, null, null, null);
                        } else if (session.order_set) {
                            callback({
                                status: 400,
                                message: "The order of the questions is already set."
                            }, null, null, null);
                        } else {
                            session.questions = questions;
                            session.order_set = true;
                            session.save(function (err) {
                                if (err) {
                                    callback(err, null, null, null);
                                } else {
                                    callback(null, session, false, false);
                                }
                            });
                        }
                    } else {//the user clicks skip
                        if (!session.order_set) {
                            callback({
                                status: 400,
                                message: "The order of the questions is not set yet."
                            }, null);
                            return;
                        }

                        var current_index = session.current_index + 1;

                        if (current_index >= session.questions.length && session.order_set) {
                            session.remove(function (err) {
                                if (err) {
                                    callback(err, null, null, null);
                                } else {
                                    callback(null, session, true, true);
                                }
                            })
                        } else {
                            session.update({
                                current_index: current_index,
                                current_attempt: 1,
                            }, function (err) {
                                if (err) {
                                    callback(err, null, null, true);
                                } else {
                                    callback(null, session, false, true);
                                }         
                            })
                        }
                    }
                }
            })
        },
        function (session, if_refresh, order_set, callback) {
            //find the report
            const current_index = session.current_index;
            const question_id = session.questions[current_index];
            const user_id = res.locals.user_id;
            const current_date = (new Date).toISOString().split('T')[0];

            Report.findOne({ user_id: user_id, question_id: question_id, date: current_date })
                .exec(function (err, report) {
                    if (err) {
                        callback(err, null, null);
                    } else if (report) {
                        if (report.is_final) {
                            callback(null, if_refresh, null);
                            return;
                        }
                        const update_content = { is_final: true };

                        //if any correct answers
                        if (!report.has_correct) update_content.skip_before_correct = session.current_attempt - 1;

                        //if perfect 
                        if (!report.is_perfect) update_content.skip_before_perfect = session.current_attempt - 1;

                        //if before try
                        if (session.current_attempt == 1) update_content.skip_before_try = true;

                        Report.findByIdAndUpdate(report._id, update_content, function (err) {
                            if (err) {
                                callback(err, null, null);
                            } else {
                                callback(null, if_refresh, null);
                            }
                        });
                    } else {
                        if (!order_set) {
                            callback(null, if_refresh, null);
                        } else {
                            const new_report = {
                                date: current_date,
                                question_id: question_id,
                                user_id: user_id,
                                type: "exercise",
                                attempts_until_correct: 0,
                                attempts_until_perfect: 0,
                                skip_before_try: true,
                                skip_before_correct: 0,
                                skip_before_perfect: 0,
                                current_attempt: 0,
                                is_final: true,
                                has_correct: false,
                                is_perfect: false,
                            }

                            const report = new Report(new_report);
                            report.save(function (err) {
                                if (err) {
                                    callback(err, null, null);
                                } else {
                                    callback(null, if_refresh, report);
                                }
                            });
                        }
                    }
                })
        },
        function (if_refresh, new_report, callback) {
            if (new_report) {
                const current_date = new Date(new_report.date);
                const year = current_date.getFullYear();
                const month = current_date.getMonth() + 1;

                ReportDate.findOne({
                    user_id: new_report.user_id,
                    year: year,
                    month: month,
                    question: new_report.question_id,
                }, function (err, record_doc) {
                    if (err) {
                        callback(err, null);
                    } else if (!record_doc) {
                        const new_record = {
                            user_id: new_report.user_id,
                            year: year,
                            month: month,
                            question: new_report.question_id,
                        };

                        const record = new ReportDate(new_record);
                        record.save(function (err) {
                            if (err) {
                                callback(err, null)
                            } else {
                                callback(null, if_refresh);
                            }
                        })
                    } else {
                        callback(null, if_refresh);
                    }
                })
            } else {
                callback(null, if_refresh);
            }
        },
    ], function (err, if_refresh) {
        if (err) {
            next(err);
        } else {
            if (if_refresh) {
                res.json({ if_refresh: true });
            } else {
                res.json({});
            }
        }
    }) 
}

exports.delete_session = function (req, res, next) {
    const session_id = mongoose.Types.ObjectId(req.body.session_id);

    async.waterfall([
        function (callback) {
            ExerciseSession.findById(session_id, function (err, session) {
                if (err) {
                    callback(err, null);
                } else if (session) {
                    if (session.user_id.toString() != res.locals.user_id.toString()) {
                        callback({
                            status: 400,
                            message: "Not the same user."
                        }, null)
                    } else if (!session) {
                        callback({
                            status: 404,
                            message: "Session not found."
                        }, null)
                    } else {
                        session.remove(function (err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, session);
                            }
                        });
                    }
                } else {
                    callback(null, null);
                }
            })
        },
        function (session, callback) {
            if (!session) {//already deleted for exceeding the max attempts
                callback(null, null);
                return;
            }

            const current_index = session.current_index;
            const question_id = session.questions[current_index];
            const user_id = res.locals.user_id;
            const current_date = (new Date).toISOString().split('T')[0];

            Report.findOne({ user_id: user_id, question_id: question_id, date: current_date })
                .exec(function (err, report) {
                    if (err) {
                        callback(err, null);
                    } else if (report) {
                        if (report.is_final) {
                            callback(null, null);
                            return;
                        }
                        const update_content = { is_final: true };

                        //if any correct answers
                        if (!report.has_correct) update_content.skip_before_correct = session.current_attempt - 1;

                        //if perfect 
                        if (!report.is_perfect) update_content.skip_before_perfect = session.current_attempt - 1;

                        //if before try
                        if (session.current_attempt == 1) update_content.skip_before_try = true;

                        Report.findByIdAndUpdate(report._id, update_content, function (err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, null);
                            }
                        });
                    } else {
                        const new_report = {
                            date: current_date,
                            question_id: question_id,
                            user_id: user_id,
                            type: "exercise",
                            attempts_until_correct: 0,
                            attempts_until_perfect: 0,
                            skip_before_try: true,
                            skip_before_correct: 0,
                            skip_before_perfect: 0,
                            current_attempt: 0,
                            is_final: true,
                            has_correct: false,
                            is_perfect: false,
                        }

                        const report = new Report(new_report);
                        report.save(function (err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, report);
                            }
                        });
                    }
                })
        },
        function (new_report, callback) {
            if (new_report) {
                const current_date = new Date(new_report.date);
                const year = current_date.getFullYear();
                const month = current_date.getMonth() + 1;

                ReportDate.findOne({
                    user_id: new_report.user_id,
                    year: year,
                    month: month,
                    question: new_report.question_id,
                }, function (err, record_doc) {
                    if (err) {
                        callback(err);
                    } else if (!record_doc) {
                        const new_record = {
                            user_id: new_report.user_id,
                            year: year,
                            month: month,
                            question: new_report.question_id,
                        };

                        const record = new ReportDate(new_record);
                        record.save(function (err) {
                            if (err) {
                                callback(err)
                            } else {
                                callback(null);
                            }
                        })
                    } else {
                        callback(null);
                    }
                })
            } else {
                callback(null);
            }
        },
    ], function (err) {
        if (err) {
            return next(err);
        } else {
            res.json({});
        }
    })
}

// Get the list of all questions for a specific level of a skill
exports.questions_list = function (req, res, next) {
    var skill_id = mongoose.Types.ObjectId(req.body.skill);
    var question_level = req.body.level;

    //check session
    if (res.locals.logged_in) {
        async.waterfall([
            function (callback) {
                ExerciseSession.findOne({
                    user_id: res.locals.user_id,
                    skill_id: skill_id,
                    category: question_level
                }, "questions current_index current_attempt", function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, result);
                    }
                })
            },
            function (session, callback) {
                if (session && session.questions.length != 0) {
                    Question.find({ _id: { $in: session.questions } })
                        .populate('options')
                        .populate('skill')
                        .exec(function (err, questions) {
                            if (err) {
                                callback(err, null);
                            } else if (questions.length != 0) {
                                callback(null, session, questions);
                            } else {
                                res.status(404).send("This session has no questions.");
                            }
                        })
                } else {
                    Question.find({ difficulty: question_level, skill: skill_id })
                        .populate('options')
                        .populate('skill')
                        .exec(function (err, questions) {
                            if (err) {
                                callback(err, null);
                            } else if (questions.length != 0) {
                                callback(null, session, questions);
                            } else {
                                res.status(404).send("This level has no questions yet.");
                            }
                        })
                }
            },
            function (session, questions, callback) {
                if (!session) {
                    const new_session = {
                        user_id: res.locals.user_id,
                        skill_id: skill_id,
                        category: question_level,
                        questions: [],
                        current_index: 0,
                        current_attempt: 1,
                        order_set: false,
                    }

                    const session = new ExerciseSession(new_session);
                    session.save(function (err, session_doc) {
                        if (err) {
                            callback(err, null);
                        } else {
                            const session_obj = session_doc.toJSON({
                                virtuals: true,
                                versionKey: false,
                            });

                            callback(null, {
                                questions: session_obj.questions,
                                current_attempt: 1,
                                current_index: 0,
                                _id: session_obj._id,
                            }, questions);
                        }
                    });
                } else {
                    callback(null, session, questions);
                }
            },
        ], function (err, session, questions) {
            if (err) {
                next(err);
            } else {
                res.json({
                    session: session,
                    questions: questions,
                });
            }
        })
    } else {
        Question.find({ difficulty: question_level, skill: skill_id })
            .populate('options')
            .populate('skill')
            .exec(function (err, questions) {
                if (err) return next(err);

                if (questions.length != 0) {
                    res.json({
                        questions: questions,
                    });
                } else {
                    res.status(404).send("This level has no questions yet.");
                }
            })
    }
};

// Check the answer and feedback of a question
function update_report(callback, report, if_perfect, correct_answers, if_max_attempt, if_new) {
    const update_content = {};
    if (report.is_final) {
        callback(null);
        return;
    }

    //if any correct answer
    if (!report.has_correct) {
        update_content.attempts_until_correct = ++report.attempts_until_correct;
        if (correct_answers > 0) update_content.has_correct = true;
    }

    //if perfect 
    if (!report.is_perfect) {
        update_content.attempts_until_perfect = ++report.attempts_until_perfect;
        if (if_perfect) update_content.is_perfect = true;
    }

    //if final
    if (!report.is_final) {
        update_content.current_attempt = ++report.current_attempt;
        if (if_perfect || if_max_attempt) update_content.is_final = true;
    }

    Report.findByIdAndUpdate(report._id, update_content, function (err) {
        if (err) {
            callback(err, null);
        } else {
            if (if_new) {
                callback(null, report);
            } else {
                callback(null, null);
            }
        }
    });
}

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

        async.parallel({
            docs: function (callback) {
                Option.find({ _id: { $in: user_options } }, "feedback correct", callback);
            },
            count: function (callback) {
                Option.count({ question: question_id, correct: true }, callback)
            },
            question: function (callback) {
                Question.findById(question_id, "attempts", callback);
            },
        }, function (err, results) {
            if (err) {
                return next(err);
            } else {
                var correct_answers = 0;
                var if_perfect = false;
                for (var option of results.docs) {
                    if (option.correct) correct_answers++;
                }

                const result = {
                    list: results.docs
                }

                if (correct_answers != results.count && results.count > 1) {
                    result.not_all = true;
                } else if (correct_answers == results.count && results.count == user_options.length) {
                    if_perfect = true;
                    result.if_perfect = true;
                }

                //check session and handle report
                const user_id = res.locals.user_id;
                if (user_id) {
                    const session_id = mongoose.Types.ObjectId(req.body.session_id);
                    const current_index = Number(req.body.current_index);
                    var new_index = Number(req.body.current_index);
                    const current_attempt = Number(req.body.current_attempt);
                    var new_attempt = current_attempt + 1;
                    const questions = req.body["questions[]"];
                    const question_doc = results.question;
                    const if_max_attempt = question_doc.attemps != "unlimited" && new_attempt > Number(question_doc.attempts);
                    if (if_perfect || if_max_attempt) {
                        new_index++;
                        new_attempt = 1;
                    } 

                    async.waterfall([
                        function (callback) {
                            //find the session first
                            ExerciseSession.findById(session_id, function (err, session) {
                                if (err) {
                                    return next(err);
                                } else {
                                    if (session.user_id.toString() != res.locals.user_id.toString()) {
                                        callback({
                                            status: 400,
                                            message: "Not the same user."
                                        }, null)
                                        return;
                                    }

                                    if (new_index >= session.questions.length && session.order_set) {
                                        session.remove(function (err) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                result.if_refresh = true;
                                                callback(null, null);
                                            }
                                        })
                                    } else {
                                        session.update({
                                            current_index: new_index,
                                            current_attempt: new_attempt,
                                        }, function (err) {
                                            if (err) {
                                                return next(err);
                                            } else {
                                                if (questions && session.questions.length == 0 && !session.order_set) {
                                                    session.questions = questions;
                                                    session.order_set = true;
                                                    session.save(callback);
                                                } else {
                                                    callback(null, session);
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        },
                        function (session, callback) {
                            //find the report
                            const current_date = (new Date).toISOString().split('T')[0];
                            Report.findOne({ user_id: user_id, question_id: question_id, date: current_date })
                                .exec(function (err, report) {
                                    if (err) {
                                        return callback(err, null);
                                    } else if (report) {
                                        update_report(callback, report, if_perfect, correct_answers, if_max_attempt, false);   
                                    } else {
                                        const new_report = {
                                            date: current_date,
                                            question_id: question_id,
                                            user_id: user_id,
                                            type: "exercise",
                                            attempts_until_correct: 0,
                                            attempts_until_perfect: 0,
                                            skip_before_try: false,
                                            skip_before_correct: 0,
                                            skip_before_perfect: 0,
                                            current_attempt: session.current_attempt - 1, 
                                            is_final: false,
                                            has_correct: false,
                                            is_perfect: false,
                                        }

                                        const report = new Report(new_report);
                                        report.save(function (err) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                update_report(callback, report, if_perfect, correct_answers, null, true); 
                                            }
                                        });
                                    }
                                })
                        },
                        function (new_report, callback) {
                            if (new_report) {
                                const current_date = new Date(new_report.date);
                                const year = current_date.getFullYear();
                                const month = current_date.getMonth() + 1;

                                ReportDate.findOne({
                                    user_id: new_report.user_id,
                                    year: year,
                                    month: month,
                                    question: new_report.question_id,
                                }, function (err, record_doc) {
                                    if (err) {
                                        callback(err);
                                    } else if (!record_doc) {
                                        const new_record = {
                                            user_id: new_report.user_id,
                                            year: year,
                                            month: month,
                                            question: new_report.question_id,
                                        };

                                        const record = new ReportDate(new_record);
                                        record.save(function (err) {
                                            if (err) {
                                                callback(err)
                                            } else {
                                                callback(null);
                                            }
                                        })
                                    } else {
                                        callback(null);
                                    }
                                })
                            } else {
                                callback(null);
                            }
                        },
                    ], function (err) {
                        if (err) {
                            return next(err);
                        } else {
                            res.json(result);
                        }
                    })
                } else {
                    res.json(result);
                }
            }
        })
    }
};

// Handle image upload
exports.upload_image = function (req, res, next) {
    if (!fs.existsSync(question_images_path)) {
        fs.mkdirSync(question_images_path);
    }
    const file_list = [];

    var index = 0;
    for (let file of req.files) {
        const file_type = file.mimetype.substring(0, 5);
        const file_extension = '.' + file.mimetype.substring(6);
        const date = (new Date()).getTime();

        let file_name = date + "_" + index++ + "_temp" + file_extension;

        file_list.push(function (callback) {
            fs.writeFile(question_images_path + file_name, file.buffer, function (err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, question_images_path.substring(8) + file_name);
                }
            })
        })
    }

    async.series(file_list, function (err, results) {
        if (err) {
            return next(err);
        } else {
            res.json(results);
        }
    })
};

exports.upload_image_s3_signature = function (req, res, next) {
    if (!req.files) {
        return next({
            status: 400,
            message: "No file found.",
        })
    }

    const file = req.files[0];

    const file_type = file.mimetype.substring(0, 5);
    const file_extension = '.' + file.mimetype.substring(6);
    const date = (new Date()).getTime();

    const file_name = date + "_temp" + file_extension;
    const bucket_name = process.env.AWS_S3_BUCKET_NAME;
    const s3_key = "Question_Images/" + file_name;

    const s3 = new AWS.S3();
    const s3Params = {
        Bucket: bucket_name,
        Key: s3_key,
        Expires: 60,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            next(err);
        } else {
            const returnData = {
                signedRequest: data,
                url: `https://${bucket_name}.s3.amazonaws.com/${s3_key}`
            };
            res.json(returnData);
        }
    });
};

exports.delete_image = function (req, res, next) {
    const file_name = req.body.src.substring(req.body.src.lastIndexOf("/") + 1);

    if (!fs.existsSync(question_images_path + file_name)) {
        res.status(404).send();
    } else {
        fs.unlink(question_images_path + file_name, function (err) {
            if (err) {
                return next(err);
            } else {
                res.status(200).send();
            }
        })
    }
}

exports.delete_image_s3 = function (req, res, next) {
    const file_name = req.body.src.substring(req.body.src.lastIndexOf("/") + 1);
    const bucket_name = process.env.AWS_S3_BUCKET_NAME;
    const s3_key = "Question_Images/" + file_name;

    const s3 = new AWS.S3();
    const s3Params = {
        Bucket: bucket_name,
        Key: s3_key,
    };

    s3.deleteObject(s3Params, function (err, data) {
        if (err) {
            next(err);
        } else {
            res.status(200).send();
        }
    });
}

// Handle audio upload
exports.upload_audio = function (req, res, next) {
    if (!fs.existsSync(question_audio_path)) {
        fs.mkdirSync(question_audio_path);
    }

    const file = req.files[0];

    const file_type = file.mimetype.substring(0, 5);
    const file_extension = '.' + file.mimetype.substring(6);
    const date = (new Date()).getTime();

    let file_name = date + "_temp" + file_extension;

    fs.writeFile(question_audio_path + file_name, file.buffer, function (err) {
        if (err) {
            next(err);
        } else {
            res.json(question_audio_path.substring(8) + file_name)
        }
    })
};

exports.upload_audio_s3_signature = function (req, res, next) {
    if (!req.files) {
        return next({
            status: 400,
            message: "No file found.",
        })
    }

    const file = req.files[0];

    const file_type = file.mimetype.substring(0, 5);
    const file_extension = '.' + file.mimetype.substring(6);
    const date = (new Date()).getTime();

    const file_name = date + "_temp" + file_extension;
    const bucket_name = process.env.AWS_S3_BUCKET_NAME;
    const s3_key = "Question_Audio/" + file_name;

    const s3 = new AWS.S3();
    const s3Params = {
        Bucket: bucket_name,
        Key: s3_key,
        Expires: 60,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            next(err);
        } else {
            const returnData = {
                signedRequest: data,
                url: `https://${bucket_name}.s3.amazonaws.com/${s3_key}`
            };
            res.json(returnData);
        }
    });
};

exports.delete_audio = function (req, res, next) {
    const file_name = req.body.src.substring(req.body.src.lastIndexOf("/") + 1);

    if (!fs.existsSync(question_audio_path + file_name)) {
        res.status(404).send();
    } else {
        fs.unlink(question_audio_path + file_name, function (err) {
            if (err) {
                return next(err);
            } else {
                res.status(200).send();
            }
        })
    }
}

exports.sorted_skill_list = function (req, res, next) {
    Skill.find({}, 'name parent description')
        .populate("sub_skills")
        .lean()
        .exec(function (err, skill_list) {
            if (err) { return next(err); }

            if (skill_list.length != 0) {
                var sorted_list = [];
                for (let skill of skill_list) {
                    if (!skill.parent) {
                        fetch_skill_levels(skill, 0, skill_list, sorted_list);
                    }
                }

                var max_level = 0;
                for (let skill of sorted_list) {
                    if (skill.level > max_level) max_level = skill.level;
                }

                const populate_depth = {
                    path: 'parent',
                };
                function deep_populate(current_depth, n) {
                    n++;
                    if (n <= max_level) {
                        current_depth.populate = {
                            path: "parent",
                        }

                        deep_populate(current_depth.populate, n);
                    }
                }

                deep_populate(populate_depth, 0);

                Skill.populate(sorted_list, populate_depth, function (err, results) {
                    if (err) {
                        return next(err);
                    } else {
                        res.json(results);
                    }
                })
            } else {
                res.json(skill_list);
            }
        });
}

exports.skill_detail = function (req, res, next) {
    const skill_id = mongoose.Types.ObjectId(req.body.skill);
    const user_id = mongoose.Types.ObjectId(res.locals.user_id);

    async.parallel({
        skill_doc: function (callback) {
            Skill.findById(skill_id)
                .lean()
                .exec(function (err, doc) {
                    if (err) {
                        next(err);
                    } else {
                        if (!doc) {
                            res.status(404).send("Skill not found");
                        } else if (doc.creator.toString() !== user_id.toString()) {//make sure it's the same user
                            next({
                                message: "You can't modify a skill created by another instructor."
                            })
                        } else {
                            callback(null, doc);
                        }
                    }
                })
        },
        children: function (callback) {
            Skill.find({ parent: skill_id }, "_id").lean().exec(callback);
        },
    }, function (err, results) {
        if (err) {
            next(err);
        } else {
            const data = {
                skill: results.skill_doc,
                children: [],
            }
            delete data.skill.id;
            delete data.skill.creator;

            for (var child of results.children) {
                data.children.push(child._id);
            }

            res.json(data);
        }
    })
}