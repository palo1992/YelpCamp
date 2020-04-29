var express = require("express"),
    router = express.Router(),
    multer = require("multer"),
    storage = multer.diskStorage({
        filename: function(req, file, callback) {
            callback(null, Date.now() + file.originalname);
        }
    }),
    imageFilter = function(req, file, cb) {
        // accept image files only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    upload = multer({ storage: storage, fileFilter: imageFilter }),
    cloudinary = require('cloudinary'),
    middleware = require("../middleware"),
    Campground = require("../models/campground"),
    User = require("../models/user"),
    Notification = require("../models/notification");


//  CLOUDINARY CONFINGURATION
cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'palo',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//  INDEX
router.get("/", function(req, res) {
    if (req.query.search) {
        const reqex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({ name: reqex }, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length < 1) {
                    req.flash("error", "No campgrounds match that query, please try again");
                    res.redirect("/");
                }
                res.render("campgrounds/index", { campgrounds: allCampgrounds, page: "campgrounds" });
            }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", { campgrounds: allCampgrounds, page: "campgrounds" });
            }
        });
    }

});

//  CREATE
router.post("/", middleware.isLoggedIn, upload.single("img"), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, async function(err, result) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.img = result.secure_url;
        // add image's public_id to campground object
        req.body.campground.imgId = result.public_id;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        try {
            let campground = await Campground.create(req.body.campground);
            let user = await User.findById(req.user._id).populate("followers").exec();
            let newNotification = {
                username: req.user.username,
                campgroundId: campground.id
            }
            for (const follower of user.followers) {
                let notification = await Notification.create(newNotification);
                follower.notifications.push(notification);
                follower.save();
            }
            res.redirect("/campgrounds/" + campground.id);
        } catch (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
    });
});


//  NEW
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});

//  SHOW
router.get("/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments likes").exec((err, foundCampground) => {
        if (err || !foundCampground) {
            req.flash("error", "Campground not found");
            console.log(err);
            res.redirect("back");
        } else {
            res.render("campgrounds/show", { campground: foundCampground });
        }
    });
});

//  EDIT 
router.get("/:id/edit", middleware.checkCampgroundOwnerShip, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        res.render("campgrounds/edit", { campground: foundCampground });
    });
});

//  UPDATE
router.put("/:id", upload.single("img"), function(req, res) {
    Campground.findById(req.params.id, async function(err, campground) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(campground.imgId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imgId = result.public_id;
                    campground.img = result.secure_url;
                } catch (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.price = req.body.campground.price;
            campground.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//  DESTROY
router.delete("/:id", function(req, res) {
    Campground.findById(req.params.id, async function(err, campground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(campground.imgId);
            campground.remove();
            req.flash("success", "Campground deleted successfully!");
            res.redirect("/campgrounds");
        } catch (err) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

//  LIKES
// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function(like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function(err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}"+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;