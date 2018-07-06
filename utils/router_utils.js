var User = require('../models/user');

//passport.js Google verification
exports.passport_google_verify = function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        const user_id = profile.id;

        User.findOne({ user_id: user_id }).exec(function (err, user_doc) {
            if (err) {
                return done(err);
            } else if (!user_doc) {
                //create a new user profile if it is not in the database
                const user_profile = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    picture: profile.image.url,
                    user_id: profile.id,
                    token: accessToken,
                    role: "student",
                }

                var new_user = new User(user_profile);
                new_user.save(function (err) {
                    if (err) {
                        return done(err);
                    } else {
                        done(null, new_user);
                    }
                })
            } else {
                return done(null, user_doc);
            }
        })
    }); 
}

exports.passport_google_check_login = function (req, res, next) {
    if (req.user) {
        res.locals.logged_in = true;
        res.locals.if_instructor = req.user.role == "instructor";
    } 

    next();
}

exports.require_login = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        return next({
            message: "Unauthorized",
            status: 401,
        });
    }
}

exports.require_role = function (req, res, next) {
    if (res.locals.validated_token) {
        User.findOne({ user_id: res.locals.validated_token.payload.sub })
            .exec(function (err, user_doc) {
                if (err) {
                    return next(err);
                } else if (!user_doc) {
                    res.locals.if_instructor = false;
                    res.locals.user_id = '';
                } else {
                    res.locals.if_instructor = user_doc.role == "instructor";
                    res.locals.user_id = user_doc._id;
                }

                next();
            })
    } else {
        next();
    }
}

/* Removed because Google one-tap sign-in is not available

async function verify_function(google_token, req, res, next) {
    const ticket = await client.verifyIdToken({
        idToken: google_token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const result = {
        token: google_token,
        exp: payload.exp,
        payload: payload
    }

    res.locals.validated_token = result;
    res.locals.logged_in = true;
    next();
}

exports.validate_token = function validate_token(req, res, next) {
    const google_token = req.body.token ? req.body.token : req.cookies.google_token;

    if (!google_token) {//The user is neither logged in or trying to log in
        res.locals.logged_in = false;
        next();
    } else {
        verify_function(google_token, req, res, next)
            .catch(function (err) {
                res.locals.logged_in = false;
                return next(err);
            })
    }
}

exports.check_role = function (req, res, next) {
    if (res.locals.validated_token) {
        User.findOne({ user_id: res.locals.validated_token.payload.sub })
            .exec(function (err, user_doc) {
                if (err) {
                    return next(err);
                } else if (!user_doc) {
                    res.locals.if_instructor = false;
                    res.locals.user_id = '';
                } else {
                    res.locals.if_instructor = user_doc.role == "instructor";
                    res.locals.user_id = user_doc._id; 
                }

                next();
            })
    } else {
        next();
    }
}

exports.require_login = function (req, res, next) {
    if (!res.locals.validated_token) {
        return next({
            message: "Unauthorized",
            status: 401,
        });
    } else {
        next();
    }
}

exports.require_role = function (req, res, next) {
    if (!res.locals.if_instructor) {
        return next({
            message: "Unauthorized",
            status: 401,
        });
    } else {
        next();
    }
}
*/