var User = require('../models/user');

//async library
const async = require('async');

// Authenticate the user
exports.autenticate = function (req, res, next) {
    const token = req.validated_token;
    User.findOne({ user_id: token.payload.sub }).exec(function (err, user_doc) {
        if (err) {
            return next(err);
        } else if (!user_doc) {
            //create a new user profile if it is not in the database
            const user_profile = {
                name: token.payload.name,
                email: token.payload.email,
                picture: token.payload.picture,
                user_id: token.payload.sub,
                role: "student",
            }

            var user = new User(user_profile);
            user.save(function (err, user_doc) {
                if (err) {
                    return next(err);
                } else {
                    res.json({
                        token: token.token,
                        exp: token.exp,
                    });
                }
            })
        } else {
            res.json({
                token: token.token,
                exp: token.exp,
            })
        }
    })
};

// Get user profile
exports.user_profile_get = function (req, res, next) {
    User.findOne({ user_id: req.validated_token.payload.sub })
        .exec(function (err, user_doc) {
            if (err) {
                return next(err);
            } else if (!user_doc) {
                return next({ message: "User not found" })
            } else {
                res.json(user_doc);
            }
        })
};

// Modify user profile
exports.user_profile_post = function (req, res, next) {
    res.send('NOT IMPLEMENTED: User profile');
}

// Get user report
exports.report_get = function (req, res, next) {
    res.send('NOT IMPLEMENTED: User report');
};