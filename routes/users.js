const { response } = require("express");
var express = require("express");
const userHelpers = require("../helpers/userHelpers");
var router = express.Router();
const config = require("../config/otp");
const otp = require("../config/otp");
const productHelpers = require("../helpers/productHelpers");
const { product, user } = require("../config/connection");
const userController = require("../controller/userController");
const { verifyLogin } = require("../controller/userController");
const { verifyLoginApi } = require("../controller/userController");

const { verifyAdmin } = require("../controller/adminControler");
const adminControler = require("../controller/adminControler");
const Client = require("twilio")(config.accountId, config.authToken);

/* GET users listing. */

// home page

router.get("/", userController.landingPage);

// user login

router.get("/login", userController.loginPageGet);

router.post("/login", userController.loginPagePost);

// user SIGNUP

router.get("/signup", userController.signUpPageGet);

router.post("/signup", userController.signUpPagePost);

//USER LOGOUT
router.get("/logout", userController.logout);

//OTP LOGIN
router.get("/otp", userController.otpPage);

router.get("/otp-login", userController.otpLogin);

router.get("/otp-verify", userController.otpVerify);

// shop page
router.get("/shop",userController.shopPage);

// product page  //page for product zoom
router.get("/products/:id", verifyLogin, userController.productPage);

// CART MANAGEMENT

// cart page
router.get("/cart", verifyLogin, userController.cartPage);

// for get prod details
router.get("/add-to-cart/:id", verifyLogin, userController.addToCart);



// put
router.put("/change-product-quantity",verifyLogin,userController.changeQuantity);

//REMOVE PRODUCT FROM CART
router.post("/remove-product", verifyLogin, userController.removeProductCart);

//CHECKOUT

router.get("/check-out", verifyLogin, userController.checkoutGet);

router.post("/check-out", verifyLogin, userController.checkoutPost);

//ORDER MANAGEMENT

//GET ORDERS
router.get("/orders", verifyLogin, userController.getorders);
//CANCEL ORDER
router.put("/cancelOrder", verifyLogin, userController.cancelOrder);
//RETURN ORDERS
router.post("/return-order", verifyLogin, userController.returnOrder);

//SUCCESS PAGE
router.get("/success", verifyLogin, userController.success);

//USER PROFILE
router.get("/profile", verifyLogin, userController.userProfile);

//EDIT ADDRESS
router.post("/edit-address", verifyLogin, userController.editAddress);

//GET ADDRESS
router.get("/address", verifyLogin, userController.getaddress);

//FILL ADDRESS
router.get("/filladdress/:id", verifyLogin, userController.filladress);

//VERIFY PAYMENT
router.post("/verify-payment", verifyLogin, userController.verifyPayment);
//DELETE ADDRESS
router.post("/deleteAddress", verifyLogin, userController.removeAddress);

//CHECK CART QUANTITY

router.get("/check-cart-quantity/:id",verifyLoginApi, userController.checkCartQuantity);////

//PAYPAL SUCCESS
router.get("/paypal-success", verifyLogin, userController.paypalSuccess);

//PAYPAL ORDER
router.post("/create-order", verifyLogin, userController.paypalOrder);

// ADD ADDRESS
router.post("/add-address", verifyLogin, userController.addAddress);

//EDIT PROFILE
router.post("/changeUserProfile",verifyLogin,userController.changeUserProfile);



//DOWNLOAD INVOIOCE
router.get("/downloadinvoice/:id", verifyLogin, userController.downloadinvoice);

//WISHLIST 
router.post("/add-wishlist/:id", verifyLogin, userController.wishlistpost);
router.get("/wishlist",verifyLogin, userController.getWishlist);
//REMOVE WISHLIST
router.post("/remove-wishListProduct",verifyLogin, userController.removeWishListProduct);

//COUPON
router.post("/apply-coupon",verifyLogin, userController.applyCoupon);

// FOR SEARCH PRODUCT
router.get("/getProductData",verifyLogin, userController.productSearch);


router.get("/forgotPassword",userController.forgotPasswordGet)

router.get("/forgot-otp-login", userController.otpLogin)
router.get("/forgot-otp-verify", userController.otpVerify);
router.get("/forgotPasswordGet",verifyLogin,userController.passwordUpdate)
router.post('/passwordChange',verifyLogin,userController.changePassword)
// router.get('/page', (req, res, next) => {
//   res.render('users/user-page')
// })

module.exports = router;
