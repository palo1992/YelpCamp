var mongoose = require("mongoose"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    seeds = [{
            name: "Cloud's Rest",
            img: "https://images.unsplash.com/photo-1471115853179-bb1d604434e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Numquam molestiae, illo accusantium corporis explicabo, obcaecati iure quam unde facere, minima minus recusandae! Cum vitae iste magnam quaerat omnis pariatur distinctio esse mollitia beatae accusantium eveniet quia, veniam accusamus dolore deserunt aliquam, molestiae velit quisquam doloribus corrupti enim sunt repellendus vero? Dolorem perspiciatis nisi magnam, repudiandae beatae iure pariatur porro velit cupiditate tempore illo possimus recusandae eaque modi laboriosam deleniti dolor quidem. Cumque blanditiis voluptate modi illo aut consequatur magnam sapiente officia amet a sunt vel, numquam reiciendis possimus libero saepe. Praesentium, esse omnis alias ullam repellendus harum nam iusto ex?"
        },
        {
            name: "Lac d'Amour, Beaufort, France",
            img: "https://images.unsplash.com/photo-1500581276021-a4bbcd0050c5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Numquam molestiae, illo accusantium corporis explicabo, obcaecati iure quam unde facere, minima minus recusandae! Cum vitae iste magnam quaerat omnis pariatur distinctio esse mollitia beatae accusantium eveniet quia, veniam accusamus dolore deserunt aliquam, molestiae velit quisquam doloribus corrupti enim sunt repellendus vero? Dolorem perspiciatis nisi magnam, repudiandae beatae iure pariatur porro velit cupiditate tempore illo possimus recusandae eaque modi laboriosam deleniti dolor quidem. Cumque blanditiis voluptate modi illo aut consequatur magnam sapiente officia amet a sunt vel, numquam reiciendis possimus libero saepe. Praesentium, esse omnis alias ullam repellendus harum nam iusto ex?"
        },
        {
            name: "Taizé, France",
            img: "https://images.unsplash.com/photo-1534187886935-1e1236e856c3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Numquam molestiae, illo accusantium corporis explicabo, obcaecati iure quam unde facere, minima minus recusandae! Cum vitae iste magnam quaerat omnis pariatur distinctio esse mollitia beatae accusantium eveniet quia, veniam accusamus dolore deserunt aliquam, molestiae velit quisquam doloribus corrupti enim sunt repellendus vero? Dolorem perspiciatis nisi magnam, repudiandae beatae iure pariatur porro velit cupiditate tempore illo possimus recusandae eaque modi laboriosam deleniti dolor quidem. Cumque blanditiis voluptate modi illo aut consequatur magnam sapiente officia amet a sunt vel, numquam reiciendis possimus libero saepe. Praesentium, esse omnis alias ullam repellendus harum nam iusto ex?"
        },
        {
            name: "Perry's Lookdown Campground, Blackheath Australia",
            img: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Numquam molestiae, illo accusantium corporis explicabo, obcaecati iure quam unde facere, minima minus recusandae! Cum vitae iste magnam quaerat omnis pariatur distinctio esse mollitia beatae accusantium eveniet quia, veniam accusamus dolore deserunt aliquam, molestiae velit quisquam doloribus corrupti enim sunt repellendus vero? Dolorem perspiciatis nisi magnam, repudiandae beatae iure pariatur porro velit cupiditate tempore illo possimus recusandae eaque modi laboriosam deleniti dolor quidem. Cumque blanditiis voluptate modi illo aut consequatur magnam sapiente officia amet a sunt vel, numquam reiciendis possimus libero saepe. Praesentium, esse omnis alias ullam repellendus harum nam iusto ex?"
        }
    ];

async function seedDB() {
    try {
        await Comment.remove({});
        await Campground.deleteMany({});
        //Add a few Campgrounds
        for (const seed of seeds) {
            let campground = await Campground.create(seed);
            let comment = await Comment.create({
                text: "Nepodstatny koment pre nepodstatne ucely",
                author: "PH|HP"
            });
            campground.comments.push(comment);
            campground.save();
        }
    } catch (err) {
        console.log(err);
    }

}

module.exports = seedDB;