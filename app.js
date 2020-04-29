//  Requiring packages
const dotenv = require('dotenv').config(),
    express = require("express"),
    flash = require("connect-flash"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    app = express();

//  Requiring models
var Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user");
//  Seeding Database Requiring
const seedDB = require("./seeds");
//  Requiring routes
var commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes/index");

//  SETTINGS
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//  SEEDING DB
//seedDB();

//  PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "TridsatOsem sposobov ako si pripravit skvelu kavu",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//  USER ARGUMENT PASS OVER..
app.use(async function(req, res, next) {
    res.locals.currentUser = req.user;
    if (req.user) {
        try {
            let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
            res.locals.notifications = user.notifications.reverse();
        } catch (err) {
            console.log(err.message);
        }
    }
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.locals.moment = require('moment');

//  Mongoose Connection
mongoose.connect("mongodb://localhost/yelp_camp", { useNewUrlParser: true, useUnifiedTopology: true });
//  LOADING PAGES
app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
//  SET UP PORT 
app.listen(process.env.PORT || 3000, process.env.IP, () => {
    console.log("YelpCamp app has started");
});