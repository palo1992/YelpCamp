var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    Campground = require("../models/campground"),
    Notification = require("../models/notification"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");


//  ROOT ROUTE
router.get("/", (req, res) => {
    res.render("landing");
});

//          AUTH ROUTES
//  SHOW REGISTER FORM
router.get("/register", function(req, res) {
    res.render("register", { page: 'register' });
});

//  CREATE USER
router.post("/register", (req, res) => {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if (req.body.adminCode === process.env.ADMIN_KEY) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            req.flash("error", err.message);
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                req.flash("success", "Welcome to YelpCamp " + user.username);
                res.redirect("/campgrounds");
            });
        }
    });
});

//  SHOW LOGIN FORM
router.get("/login", function(req, res) {
    res.render("login", { page: 'login' });
});

//  LOGIN USER
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), (req, res) => {});

//  LOGOUT USER
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//          USERS
//  SHOW USER PROFILE
router.get("/users/:id", async function(req, res) {
    try {
        let user = await User.findById(req.params.id).populate("followers").exec();
        let campgrounds = await Campground.find().where("author.id").equals(user._id).exec();
        res.render("users/show", { user, campgrounds });
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect("back");
    }
});

//  FOLLOW USER
router.get("/follow/:id", middleware.isLoggedIn, async function(req, res) {
    try {
        let user = await User.findById(req.params.id);
        user.followers.push(req.user.id);
        user.save();
        req.flash("success", "Successfully followed " + user.username + "!");
        res.redirect("/users/" + req.params.id);
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
});
//          NOTIFICATIONS
//  VIEW NOTIFICATIONS
router.get("/notifications", middleware.isLoggedIn, async function(req, res) {
    try {
        let user = await User.findById(req.user._id).populate({
            path: "notifications",
            options: { sort: { "_id": -1 } }
        }).exec();
        let allNotifications = user.notifications;
        res.render("notifications/index", { allNotifications });
    } catch (err) {
        req.flash("err", err.message);
        res.redirect("back");
    }
});

//  HANDLE NOTIFICATIONS
router.get("/notifications/:id", middleware.isLoggedIn, async function(req, res) {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campgroundId}`);
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
});

//          PASSWORD RECOVERY
//  SHOW FORGOT PWD FORM
router.get("/forgot", (req, res) => {
    res.render("forgot");
});

// CREATE TOKEN FOR FORGOTTEN PWD AND SEND IT VIA EMAIL IF EMAIL IS REGISTERED
router.post("/forgot", (req, res, next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, (err, user) => {
                if (!user) {
                    req.flash("error", "No account with that email adress exists!");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;

                user.save((err) => {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "pavol1992@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "pavol1992@gmail.com",
                subject: "YelpCamp project password recovery",
                text: "You are receiving this because you (or someone else) have requested the reset of the password.\n\n" +
                    "Please click on the following link or paste this into your browser to complete the process\n\n" +
                    "http://" + req.headers.host + "/reset" + token + "\n\n" +
                    "If you did not request this, please ignore this email and your password will remain unchange.\n\n"
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                console.log("mail.sent");
                req.flash("success", "An e-mail has been send to " + user.email + " with further instrunctions.\n\n");
                done(err, "done");
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect("/forgot");
    });
});
router.get("/forgot:token", (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", { token: req.params.token });
    });
});
router.post("/reset:token", (req, res) => {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
                if (!user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if (req.body.newPassword === req.body.confirmPassword) {
                    user.setPassword(req.body.newPassword, (err) => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save((err) => {
                            req.logIn(user, (err) => {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect("back");
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "pavol1992@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "pavol1992@gmail.com",
                subject: "Your password has been changed",
                text: "Hello,\n\n" + "this is a confirmation e-mail that the password for your account " + user.email + " has been changed."
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                req.flash("success", "Success! Your password has been changed.");
                done(err);
            });
        }
    ], (err) => {
        res.redirect("/campgrounds");
    });
});
module.exports = router;