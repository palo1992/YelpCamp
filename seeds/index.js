const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Campground = require('../models/campground');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');
const axios = require('axios');

dotenv.config();
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connected');
})

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

async function seedImg() {
  try {
    const resp = await axios.get('https://api.unsplash.com/photos/random', {
      params: {
        client_id: process.env.UNSPLASH,
        collections: 483251,
      },
    });
    return resp.data.urls.small;
  } catch (err) {
    console.error(err)
  }
}

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const imgUrl = await seedImg();
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: '650c956f296f39044f258597',
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      geometry: {
        type: "Point",
        coordinates: [cities[random1000].longitude, cities[random1000].latitude]
      },
      images: [
        (imgUrl)? {url: imgUrl,
        filename: `YelpCamp/${sample(descriptors)+random1000}`} :
        {url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1695820311/YelpCamp/hq1wl8ppo63ylieishlk.png`,
        filename: 'default'}
      ],
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. A dolorem illum sint voluptate nesciunt aperiam? Quibusdam molestiae minus dolor quia numquam veniam mollitia laborum placeat.',
      price: price
    });
    await camp.save();
  }
}

seedDB().then(() => {
  mongoose.connection.close();
});