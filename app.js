var express           = require('express');
var methodOverride    = require('method-override');
var passport          = require('passport');
var dotenv            = require('dotenv').config()
var LocalStrategy     = require('passport-local').Strategy;
var session           = require('express-session');
var bodyParser        = require('body-parser');
var mongoose          = require('mongoose');
var flash             = require('connect-flash');
var expressValidator  = require('express-validator');
var paypal            = require('paypal-rest-sdk');
var seedDB            = require("./seeds");
var app               = express();

var challengeRoutes = require ("./routes/challenges");
var indexRoutes = require ("./routes/index");
var solutionRoutes = require ("./routes/solutions");
var paypalRoutes = require("./routes/paypal");
var User = require('./models/user');

//seedDB();

//app config
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
mongoose.connect("mongodb://localhost/idea_crowd");
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

//paypal confing
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AWwAX1gww2vujeMHIb8eiDCCgghVek3JEXRYZGkY3HiMJ-bdjqe9AWKhg8Id_M0jMe1NarToX-jxqSSv',
  'client_secret': 'ELnIWSA4R8IejPsc6hTkIGvDe93CLEnBv_LDW2aIjGcARXiNpsb1f9qYLtXxDuQt3F0eFBaIhF1BLCJZ'
});

//passportjs config
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  },
  function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'incorrect email' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'incorrect password' });
      }
      // Make sure the user has been verified
      if (!user.isVerified) {
        return done (null, false, { message: 'your account has not been verified' });
      } 
      return done(null, user);
    });
  }
));

//global variables
app.use(function(req, res, next) {
  res.locals.messages = req.flash('info');
  res.locals.errMessages = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

//use routes 
app.use (indexRoutes);
app.use (challengeRoutes);
app.use (solutionRoutes);
app.use (paypalRoutes);

//if route does not exist
app.get('*', function(req, res){
  res.redirect("/");
});

//server config
app.listen(process.env.PORT || 3000, function () {
  console.log('App has started!')
});
