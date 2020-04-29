//all the middleware goes here
var middlewareObj = {},
    Campground = require("../models/campground"),
    Comment = require("../models/comment");


middlewareObj.checkCampgroundOwnerShip = (req, res, next) => {
    if (req.isAuthenticated()) {
        // user's article?
        Campground.findById(req.params.id, (err, foundCampground) => {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found");

                res.redirect("back");
            } else {
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });

    } else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnerShip = (req, res, next) => {
    if (req.isAuthenticated()) {
        // user's article?
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err || !foundComment) {
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in for this action!");
    res.redirect("/login");
}
module.exports = middlewareObj;