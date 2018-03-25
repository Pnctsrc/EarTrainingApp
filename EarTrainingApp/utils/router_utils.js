//google auth 
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verify_function(google_token, req, next) {
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
    next();
}

exports.validate_token = function validate_token(req, res, next) {
    const google_token = req.body.token ? req.body.token : req.cookies.google_token;
    verify_function(google_token, req, next)
        .catch(function (err) {
            return next(err);
        })
}