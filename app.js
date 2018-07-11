var sslRedirect = require('heroku-ssl-redirect');
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog');  //Import routes for "catalog" area of site
var api = require('./routes/api');
var report = require('./routes/report');
var class_route = require('./routes/class');

//passport-google-login
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var passport_google_verify = require('./utils/router_utils').passport_google_verify;
var passport_google_check_login = require('./utils/router_utils').passport_google_check_login;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
    passport_google_verify
));

var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = process.env.MONGO_URI;
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'secret secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.IS_SECURE == "true"? true : false}
}));
app.use(passport.initialize());
app.use(passport.session());

// enable ssl redirect
app.use(sslRedirect());

// check login status
app.use(passport_google_check_login);

app.use('/', routes);
app.use('/users', users);
app.use('/catalog', catalog);  // Add catalog routes to middleware chain.
app.use('/api', api);
app.use('/report', report);
app.use('/class', class_route);

// catch 404 and forward to error handler
app.use(function (err, req, res, next) {
    if (err) {
        next(err);
    } else {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
