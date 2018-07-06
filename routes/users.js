var express = require('express');
var router = express.Router();

// Require controller modules.
var user_controller = require('../controllers/userController');

//user validations
var require_login = require('../utils/router_utils').require_login;
var require_role = require('../utils/router_utils').require_role;

var passport = require('passport');

var User = require('../models/user');

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

/// USER ROUTES ///

/* Removed because Google one-tap sign-in is not available

// POST request to authenticate the user
router.post('/authenticate', user_controller.autenticate);
*/

// GET request to prompt for user authentication
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET request after the authentication
router.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/' }));

// GET request to log out
router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// GET request for user profile. 
router.get('/profile', require_login, user_controller.user_profile_get);

// POST request to modify user profile. 
router.post('/profile', require_login, user_controller.user_profile_post);

// GET request for user report. 
router.get('/report', require_login, user_controller.report_get);

module.exports = router;
