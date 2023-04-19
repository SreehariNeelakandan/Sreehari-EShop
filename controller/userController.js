require("dotenv").config();

const { response } = require("express");
var express = require("express");
const userHelpers = require("../helpers/userHelpers");
var router = express.Router();
const config = require("../config/otp");
const otp = require("../config/otp");
const productHelpers = require("../helpers/productHelpers");
var couponHelpers = require("../helpers/couponHelpers");
const { product } = require("../config/connection");
const userController = require("../controller/userController");
const { resolveInclude } = require("ejs");
const { Db, ObjectId } = require("mongodb");
var db = require("../config/connection");
const Client = require("twilio")(config.accountId, config.authToken);

const paypal = require("@paypal/checkout-server-sdk");
const Environment =
  process.env.NODE_ENV === "production"
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;
const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);
let couponAmount = 0;
module.exports = {
  verifyLogin: (req, res, next) => {
    if (req.session.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  },
  verifyLoginApi: (req, res, next) => {
    if (req.session.loggedIn) {
      console.log('if is working');
      next();
    } else {
      console.log('why else is working');
      res.send({login:false});
    }
  },

  landingPage: async function (req, res, next) {
    let user = req.session.loggedIn;
    let product = await productHelpers.getAllproducts();
    let mainBanner = await productHelpers.getBanner();
    let cataBanner= await productHelpers.getCataBanner()
    console.log(cataBanner);
    // console.log(req?.session?.user?._id,"logdincase");
    if (user) {
      let cartCount = await userHelpers.getCartCount(req.session.user._id);

      res.render("index", { nav: true, user, cartCount, product, mainBanner,cataBanner });
    } else {
      res.render("index", { nav: true, user: false, product, mainBanner,cataBanner });
      // res.redirect('/login')
    }
  },

  loginPageGet: (req, res, next) => {
      res.render("users/user-login", { nav: false });
    // if (req.session.loggedIn) {
    //   res.redirect("/");
    // } else {
    //   res.render("users/user-login", { nav: false });
    // }
  },

  loginPagePost: (req, res) => {
    // console.log(req.body);
    userHelpers.doLogin(req.body).then((response) => {
      // console.log("my respp", response);
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.send({ value: "success"});
      } else if (response.blocked) {
        res.send({ value: "blocked" });
      } else {
        res.send({ value: "failed" });
      }
    });
  },

  signUpPageGet: (req, res) => {
    res.render("users/user-signup", { nav: false });
  },

  signUpPagePost: (req, res) => {
    userHelpers.doSignUp(req.body).then((response) => {
      if (!response.status) {
        res.send({ value: "failed" });
      } else {
        req.session.loggedIn = true;
        res.send({ value: "success" });
      }
    });
  },
  otpPage: (req, res) => {
    res.render("users/otp");
  },

  otpLogin: (req, res) => {
    userHelpers
      .isUser(req.query.mobileNumber)
      .then((userExsist) => {
        console.log(userExsist,"OTP WISE USER");
        if (userExsist) {
          Client.verify
            .services(config.serviceId)
            .verifications.create({
              to: `+91${req.query.mobileNumber.trim()}`,
              channel: "sms",
            })
            .then((data) => {
              console.log(data,"after log in");
              console.log("ayas here ");
              req.session.user = userExsist
              req.session.loggedIn = true;
              res.send({ value: true });   //////HEAD ERROR
            })
            .catch((error) => {
              res.send({ value: false, message: error.message });
            });
        } else {
          res.send({ value: false, message: "user does not exist" });
        }
      })
      
  },

  otpVerify: (req, res) => {
    Client.verify
      .services(otp.serviceId)
      .verificationChecks.create({
        to: `+91${req.query.mobileNumber.trim()}`,
        code: req.query.code,
      })
      .then((data) => {
        if (data.valid) {
          req.session.loggedIn = true;
          res.status(200).send({ value: "success" });
        } else {
          res.send({ value: "failed" });
        }
      })
      .catch((err) => {
        res.send(err);
      });
  },

  shopPage:async (req, res, next) => {
    console.log(req.query,"query");
    let user=req.session.loggedIn
    // let category=productHelpers.getCategory()
    
    // console.log(category);
    let cataBanner= await productHelpers.getCataBanner()

    productHelpers.getAllproducts(req.query).then(async (products) => {
      let cartCount = await userHelpers.getCartCount(req.session.user._id);
      console.log(cartCount,'d');
      res.render("users/user-shop", {
        products,
        nav: true,
        user,
        cartCount,
        cataBanner
        // category
      });
    });

    // res.redirect("/");
  },

  productPage: async (req, res) => {
    let proId = req.params.id;
    productHelpers.getProductDetails(proId).then(async (products) => {
      let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);
      res.render("users/user-product", {
        products,
        nav: true,
        user: true,
        cartCount,
      });
    });
  },

  cartPage: async (req, res) => {
    let products = await userHelpers.getCartProducts(req?.session?.user?._id);
    // console.log(products);
    let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);
    let total = await userHelpers.getTotalAmmount(req?.session?.user?._id);
    // console.log(total, "two total");
    let offertotal = total?.offertotal;
    total = total?.total;
    res.render("users/cart", {
      total,
      offertotal,
      products,
      nav: true,
      user: true,
      cartCount,
    });
  },
  addToCart: (req, res) => {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true });
    });
  },

  changeQuantity: (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmmount(req.session.user._id);
      // console.log(response.total, "mmmmmmmmmm");

      res.json(response);
    });
  },
  removeProductCart: (req, res) => {
    // console.log(req.body);
    userHelpers.removeProductFromCart(req.body).then((response) => {
      res.json(response);
    });
  },
  checkoutGet: async (req, res) => {
    userId = req.session.user._id;
    let address = await userHelpers.getaddress(userId);
    let coupondata = await couponHelpers.getallcoupon();
    let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);
    let total = await userHelpers.getTotalAmmount(req?.session?.user?._id);
    let offertotal = total?.offertotal;
    total = total?.total;
    res.render("users/checkout", {
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      total,
      offertotal,
      coupondata,
      nav: true,
      user: true,
      address,
      cartCount,
     userHelpers 

    });
  },
  checkoutPost: async (req, res) => {
    let totalAmmount = await userHelpers.getTotalAmmount(req.session.user._id);
    let total = totalAmmount?.offertotal;
    total = total - couponAmount;
    // console.log(total, "tatatatatatata");

    req.body.userId = req.session.user._id;

    userHelpers
      .placeOrder(req.body, total, req.session.coupon, couponAmount)
      .then((response) => {
        if (req.body.payment == "COD") {
          req.session.coupen = "";
          couponAmount = 0;
          res.send({ success: true });
        } else if (req.body.payment == "razorpay") {
          userHelpers
            .generatRazorpay(req.session.user._id, total)
            .then((response) => {
              req.session.coupon = "";
              couponAmount = 0;
              console.log(response, "razor response");
              res.json(response);
            });
        } else {
          req.session.coupen = "";
          couponAmount = 0;
          res.json({ paypal: true, totalPrice: total });
        }
      });
  },


  success: (req, res) => {
    res.render("users/successpage");
  },
  getorders: async (req, res) => {
    req.body.userId = req?.session?.user?._id;
    let orderItems = await userHelpers.getorders(req?.body?.userId);
    console.log("orderssss", orderItems);
    let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);

    res.render("users/orders", {
      orderItems,
      nav: true,
      user: true,
      cartCount,
    });
  },
  cancelOrder: (req, res) => {
    // console.log(req.body, "naa body");
    userHelpers.cancelOrder(req.body, req.session.user._id).then((response) => {
      res.json(response);
    });
  },

  userProfile: async (req, res) => {
    userId = req?.session?.user?._id;
    let userdetails = await userHelpers.userdetails(userId);
    let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);
    userHelpers.getaddress(userId).then((address) => {
      // console.log("kjhgfd", address, "kjhg");
      res.render("users/profile", {
        nav: true,
        user: true,
        address: address[0],
        userdetails,
        cartCount,
      });
    });
  },

  getaddress: (req, res) => {
    userId = req.session.user._id;

    userHelpers.getaddress(userId).then((address) => {
      res.render("users/address", { address });
    });
  },
  filladress: (req, res) => {
    userId = req.session.user._id;
    addrsId = req.params.id;
    // console.log(addrsId);
    userHelpers.filladress(userId, addrsId).then((data) => {
      // console.log(data[0].address,"my address");
      res.send(data[0].address);
    });
  },
  verifyPayment: (req, res) => {
    // console.log(req.body);
    userHelpers
      .verifyPayment(req.body)
      .then(() => {
        userHelpers.changePaymentStatus(req.body["order[receipt]"],req.session.user._id).then(() => {
          // console.log("payment successfull");
          res.json({ status: true });
        });
      })
      .catch((err) => {
        // console.log(err);
        res.json({ status: false });
      });
  },
  logout: (req, res) => {
    req.session.user=""
    req.session.loggedIn = false;
    res.redirect("/login");
  },
  removeAddress: (req, res) => {
    userId = req.session.user._id;
    userHelpers.removeAddress(req.body.addressId, userId).then((response) => {
      res.json({ status: "success" });
    });
  },
  paypalSuccess: async (req, res) => {
    const orderDetails = await db.order.find({ userId: req.session.user._id });
    let orders = orderDetails[0].orders.slice().reverse();
    let orderId1 = orders[0]._id;
 
    let orderId = "" + orderId1;
   
    userHelpers.changePaymentStatus(orderId,req.session.user._id).then((data) => {
      res.json({ status: true });
    });
  },
  paypalOrder: async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    const total = req.body.total;
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total,
              },
            },
          },
        },
      ],
    });

    try {
      const order = await paypalClient.execute(request);
      // console.log(order);
      res.json({ id: order.result.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  addAddress: (req, res) => {
    // console.log(req.body, "jgghghj");
    userId = req.session.user._id;
    userHelpers.addressAdd(req.body, userId).then((response) => {
      res.json(response);
    });
  },

  checkCartQuantity: (req, res) => {
    // console.log(req.params.id, "producttttttt");
    userHelpers
      .checkCartQuantity(req.session.user._id, req.params.id)
      .then((quantity) => {
        res.send(quantity);
      });
  },
  editAddress: (req, res) => {
    let userId = req.session.user._id;
    userHelpers.updateAddress(req.body, userId).then(() => {
      res.send({ status: true });
    });
  },

  changeUserProfile: async (req, res) => {
    // console.log(req.body, "first body");

    let user = await db.user.findOne({ _id: req.session.user._id });

    userHelpers.editProfile(req.body, user).then((response) => {
      // console.log("response", response);
      if (response.status) {
        console.log("succ");
        res.json({ status: true });
      } else {
        console.log("fails");
        res.json({ status: false });
      }
    });
  },
  downloadinvoice: (req, res) => {
    let orderId = req.params.id;
    // console.log(orderId, "idsssss");
    let userId = req.session.user._id;
    userHelpers.getdata(orderId, userId).then((details) => {
      res.send(details[0]);
    });
  },

  returnOrder: (req, res) => {
    // console.log(req.body, "my body");
    userHelpers
      .returnProduct(req.body, req.session.user._id)
      .then((response) => {
        res.send(response);
      });
  },

  applyCoupon: async (req, res) => {
    req.session.coupon = req.body._id;
    let couponId = req.body._id;
    let totalAmmount = await userHelpers.getTotalAmmount(req.session.user._id);
    let total = totalAmmount?.offertotal;

    couponHelpers.getCoupon(couponId).then((data) => {
      if (total >= data.minPurchase) {
        couponHelpers.addCouponToUser(req.session.user._id, ObjectId(req.body._id), false).then((d) => {
            if (
              (total * data.discountPercentage) / 100 <=
              data.maxDiscountValue
            ) {
              let couponTotal = (total * data.discountPercentage) / 100;
              couponAmount = couponTotal;
              res.send({
                status: true,
                couponAmount: couponAmount,
                offerTotal: total - couponAmount,
              });
            } else {
              couponAmount = data.maxDiscountValue;
              res.send({
                status: true,
                couponAmount: couponAmount,
                offerTotal: total - couponAmount,
              });
            }
          })
          .catch((err) => {
            res.send({ status: false, message: "coupon already used" });
          });
      } else {
        res.send({ status: false, message: "coupn not applicable" });
      }
    });
  },
  productSearch: (req, res) => {
    productHelpers.getAllproducts().then((response) => {
      res.json(response);
    });
  },
  wishlistpost: (req, res) => {
   
    productHelpers.addwishlist(req?.session?.user?._id, req?.params?.id).then((response) => {
        res.send(response);
      });
  },
  getWishlist: async (req, res) => {
    let cartCount = await userHelpers.getCartCount(req?.session?.user?._id);
    productHelpers.getAllWishlist(req?.session?.user?._id).then((product) => {
      // console.log(product, "////////////");
      res.render("users/wishlist", {
        nav: true,
        user: true,
        product,
        cartCount,
      });
    });
  },
  removeWishListProduct: (req, res) => {
    productHelpers.deleteWishList(req.body).then((response) => {
      res.json(response);
    });
  },

  forgotPasswordGet:(req,res)=>{
    
    res.render('users/forgotpassword')
  },
  passwordUpdate:(req,res)=>{
    res.render('users/changePassword')
  },
  changePassword:async(req,res)=>{

    console.log(req.body,"body");
    // let user=await db.user.findOne({_id:req.session.user._id})
    console.log(req.session.user._id,"new pass user");
    userHelpers.changePassword(req.body,req.session.user._id).then((response)=>{
      if(response.status){
        console.log("succ");
        res.json({ status: true });
      }else{
        console.log("faill");
        res.json({ status: false });

      }
    })
  }
};
