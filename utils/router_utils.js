var User = require('../models/user');

//google auth
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    req.validated_token = result;
    res.locals.logged_in = true;
    next();
}

exports.validate_token = function validate_token(req, res, next) {
    const google_token = req.body.token ? req.body.token : req.cookies.google_token;

    if (!google_token) {//The user is neither logged in or trying to log in
        res.locals.logged_false = true;
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
    if (req.validated_token) {
        User.findOne({ user_id: req.validated_token.payload.sub })
            .exec(function (err, user_doc) {
                if (err) {
                    return next(err);
                } else if (!user_doc) {
                    return next({
                        message: "User not found"
                    })
                } else {
                    res.locals.if_instructor = user_doc.role == "instructor";
                    req.if_instructor = user_doc.role == "instructor";
                    req.user_id = user_doc._id;
                    next();
                }
            })
    } else {
        next();
    }
}

exports.require_login = function (req, res, next) {
    if (!req.validated_token) {
        return next({message:"Unauthorized"});
    } else {
        next();
    }
}

exports.require_role = function (req, res, next) {
    if (!req.if_instructor) {
        return next({ message: "Unauthorized" });
    } else {
        next();
    }
}