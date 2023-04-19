var express = require("express");
const { product } = require("../config/connection");
var router = express.Router();
const layout = "admin-layout";
var productHelpers = require("../helpers/productHelpers");
var adminHelpers = require("../helpers/adminHelpers");
const adminController = require("../controller/adminControler");
const { Router, response } = require("express");
const { verifyAdmin } = require("../controller/adminControler");
const { editProduct } = require("../helpers/productHelpers");
const multer = require("multer");
const { route } = require("./users");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,"public/productimages");
  },
  filename: (req, file, cb,err) => {
    // console.log(file);
    if(err)
    {
      console.log(err);
    }
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,"public/assets/banner-images");
  },
  filename: (req, file, cb,err) => {
    // console.log(file);
    if(err)
    {
      console.log(err);
    }
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload2 = multer({ storage: storage2 });




// login
router.get("/login", adminController.loginGet);

router.post("/login", adminController.loginPost);

router.get("/logout", adminController.logout);

router.get("/logintwo", adminController.logintwoget);

router.post("/logintwo", adminController.logintwo);

// ADMIN PAGE
router.get("/", adminController.dashBoard);

// admin products

router.get("/chartGraph", adminController.chartGraph);
router.get("/products", verifyAdmin, adminController.productPage);

//ADD products
router.get("/add-product", verifyAdmin, adminController.addProductGet);

router.post('/add-product',verifyAdmin,upload.array('image'), adminController.addProductPost)


// edit products
router.get("/edit-product/:id", verifyAdmin, adminController.editProductGet);
router.post("/edit-product/:id",upload.array('image') ,adminController.editProductPost);

// Delete products
router.delete("/delete-product/:id", verifyAdmin, adminController.deleteProduct);

// USER Management
// user view
router.get("/users", verifyAdmin, adminController.userManagement);

router.get("/block-user/:id", verifyAdmin, adminController.blockUserGet);

router.get("/unblock-user/:id", verifyAdmin, adminController.unblockUserGet);

//CATEGORY MANAGEMENT

router.get("/category", verifyAdmin, adminController.category);
// add caegory
router.get("/add-category", verifyAdmin, adminController.addCategoryGet);

router.post("/add-category", verifyAdmin, adminController.addCategoryPost);

// edit catogory

router.get("/edit-category/:id", verifyAdmin, adminController.editCategoryGet);

router.post("/edit-category/:id",verifyAdmin,adminController.editCategoryPost);

// delete catogory
router.delete("/delete-category/:id", verifyAdmin, adminController.deleteCategory);

router.get("/orders", verifyAdmin, adminController.getOrderDetails);

router.get("/view-more/:id", verifyAdmin, adminController.viewMore);

router.put("/shippingStatus",verifyAdmin,adminController.changeShippingStatus);



router.get('/sales-report',verifyAdmin,adminController.salesreport)

router.get('/generateExcel',adminController.getExceldata)

router.get('/banner-management',verifyAdmin,adminController.bannerManagement)
router.get('/mainBanner',verifyAdmin,adminController.mainBanner)

router.get('/add-bannerMain',verifyAdmin,adminController.mainBannerget)
router.post('/add-bannerMain',verifyAdmin,upload2.array('image') ,adminController.mainBannerpost)

router.delete('/delete-mainBanner/:id',verifyAdmin,adminController.deleteMainBanner)

router.get('/catabanner',verifyAdmin,adminController.cataBannerget)
router.get('/addCataBanner',verifyAdmin,adminController.addCataBanner)
router.post('/add-cataBanner',verifyAdmin,upload2.array('image'),adminController.addCataBannerPost)

router.delete('/delete-cataBanner/:id',verifyAdmin,adminController.deleteCataBanner)



router.get('/coupon',verifyAdmin,adminController.getallcoupon)

router.get('/add-coupon',verifyAdmin,adminController.addCoupon)

router.post('/add-coupon',verifyAdmin,adminController.addcoupon)

router.get("/edit-coupon/:id", verifyAdmin, adminController.editCouponGet);

router.post("/edit-coupon/:id",verifyAdmin, adminController.editCouponPost);

router.get('/generate-coupon-code',verifyAdmin,adminController.generateCoupon)

router.delete('/delete-coupon/:id',verifyAdmin,adminController.deleteCoupon)

module.exports = router;
