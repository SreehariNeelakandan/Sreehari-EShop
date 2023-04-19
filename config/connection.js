const { ObjectID } = require("bson");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose");
var express = require("express");
var app = express();
app.use(express.json());

require("dotenv").config();

// db connection
const db = mongoose.createConnection(process.env.MONGO_URL);
db.on("error", (err) => {
  console.log(err);
});
db.once("open", () => {
  console.log("database connect");
});

// product schema
const productschema = new mongoose.Schema({
  name: String,
  catogory: String,
  price: Number,
  description: String,
  stock: Number,
  img: Array,
  offerpercentage: Number,
  offerprice: Number,
});
const Adminschema = new mongoose.Schema({
  email: String,
  password: String,
});

const Userschema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: {
    type: Number,
  },
  status: {
    type: Boolean,
    default: true,
  },
  wallet: Number,
  coupon: [{ couponId: ObjectID, status: Boolean }],
});
const Categoryschema = new mongoose.Schema({
  name: String,
});
const CartSchema = new mongoose.Schema({
  user: ObjectId,
  products: [
    {
      item: mongoose.Types.ObjectId,
      quantity: Number,
      name: String,
    },
  ],
});

const WishlistSchema = new mongoose.Schema({
  user: ObjectId,
  products: [
    {
      item: mongoose.Types.ObjectId,
    },
  ],
});

const addressSchema = new mongoose.Schema({
  user: mongoose.Types.ObjectId,
  address: [
    {
      firstname: String,
      lastname: String,
      country: String,
      street: String,
      city: String,
      state: String,
      pincode: Number,
      phone: Number,
      email: String,
    },
  ],
});

const orderShema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,

  orders: [
    {
      firstname: String,
      lastname: String,
      phone: Number,
      paymentMethod: String,
      productDetails: Array,
      totalPrice: Number,
      totalQuantity: Number,
      paymentStatus: {
        type: Number,
        default: 0,
      },
      shippingAddress: Object,
      createdAt: {
        type: Date,
        default: new Date(),
      },
      couponAmount: Number,
      status: {
        type: Boolean,
        default: true,
      },
    },
  ],
});

const bannerSchema = new mongoose.Schema({
  name: String,
  description: String,
  marketprice: Number,
  offerprice: Number,
  img: Array,
});

const catabannerSchema = new mongoose.Schema({
  title: String,
  url: String,
  img: Array,
});

const couponSchema = new mongoose.Schema({
  couponName: String,
  expiry: {
    type: Date,
  },
  status: Boolean,
  minPurchase: Number,
  discountPercentage: Number,
  maxDiscountValue: Number,
  description: String,
});

module.exports = {
  product: db.model("products", productschema),
  user: db.model("users", Userschema),
  categories: db.model("category", Categoryschema),
  cart: db.model("cart", CartSchema),
  address: db.model("address", addressSchema),
  order: db.model("order", orderShema),
  admin: db.model("admin", Adminschema),
  banner: db.model("banner", bannerSchema),
  wishlist: db.model("wishlist", WishlistSchema),
  coupon: db.model("coupon", couponSchema),
  cataBanner: db.model("catebanner", catabannerSchema),
};
