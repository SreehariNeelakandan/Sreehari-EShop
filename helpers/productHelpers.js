const { response } = require("../app");
const { product, categories } = require("../config/connection");
var db = require("../config/connection");

module.exports = {
  addProducts: (product) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await db.product(product).save();
        // console.log(data,'this is my data');
        resolve(data);
      } catch (error) {
        console.log(error);
      }
    });
  },
  
  getAllproducts: (query) => {
    return new Promise( (resolve, reject) => {
      try {
        // console.log(query,'my query');
        if(query){

          db.product.find(query).then((data)=>{

          
            resolve(data);
          })

        }else{
          // console.log("else");
          db.product.find({}).then((data)=>{
            resolve(data);
          })
        }
       
      } catch (error) {
        console.log(error);
      }
    });
  },
  getProductDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.product.findOne({ _id: proId }).then((product) => {
          resolve(product);
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  editProduct: (data, prodId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let dbProData= await db.product.findOne({_id:prodId})

        if(data.img.length==0){
          data.img=dbProData.img
        }else{

          await db.product.updateOne(

            { _id: prodId },
            {
              name: data.name,
              catogory: data.catogory,
              price: data.price,
              description: data.description,
              stock: data.stock,
              img: data.img,
              offerpercentage: data.offerpercentage,
              offerprice: data.offerprice,
            }
          )

        }
      resolve()
         
      } catch (error) {
        console.log(error);
      }
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      try {
        db.product.deleteOne({ _id: proId }).then(() => {
          resolve();
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  addCategory: (category) => {
    return new Promise(async (resolve, reject) => {
      try {
        category.name = await category.name.toUpperCase();
        db.categories.find({ name: category.name }).then(async (data) => {
          let response = {};
          if (data.length == 0) {
            // category.name =await category.name.toLowerCase()
            let cata = db.categories(category);
            cata.save();
            response.data = cata;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
     try{ let category = await db.categories.find({});
      resolve(category);}
      catch(error){
        console.log(error);
      }
    });
  },
  updateCategory: (cateId, cateDetails) => {
    // console.log(cateId,"/////,cateDetails,"...");
    return new Promise(async (resolve, reject) => {
      try {
        cateDetails.name = await cateDetails.name.toUpperCase();

        let data = await db.categories.find({
          _id: cateId,
          name: cateDetails.name,
        });

        if (data.length != 0) {
          await db.categories
            .updateOne(
              { _id: cateId },
              {
                $set: {
                  name: cateDetails.name,
                },
              }
            )
            .then((data) => {
              data.status = true;
              resolve(data);
            });
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },

  // updateCoupon: (cateId, cateDetails) => {
  //   // console.log(cateId,"/////,cateDetails,"...");
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       cateDetails.name = await cateDetails.name.toUpperCase();

  //       let data = await db.categories.find({
  //         _id: cateId,
  //         name: cateDetails.name,
  //       });

  //       if (data.length != 0) {
  //         await db.categories
  //           .updateOne(
  //             { _id: cateId },
  //             {
  //               $set: {
  //                 name: cateDetails.name,
  //               },
  //             }
  //           )
  //           .then((data) => {
  //             data.status = true;
  //             resolve(data);
  //           });
  //       } else {
  //         resolve({ status: false });
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   });
  // },

  updateCoupon: (data, prodId) => {
    console.log('sy');
    console.log(data,prodId,'ad');
    return new Promise(async (resolve, reject) => {
      try {
        // let dbProData= await db.coupons.findOne({_id:prodId})
        console.log('update'),

          await db.coupon.updateOne(
            { _id: prodId },

                          {
                $set: {
                  // name: data.couponName,
                  couponName: data.couponName,
                  expiry: data.expiry,
                  minPurchase: data.minPurchase,
                  description: data.description,
                  discountPercentage: data.discountPercentage,
                  maxDiscountValue: data.maxDiscountValue
                },
              }
            // {
            //   name: data.name,
              // catogory: data.catogory,
              // price: data.price,
              // description: data.description,
              // stock: data.stock,
              // img: data.img,
              // offerpercentage: data.offerpercentage,
              // offerprice: data.offerprice,
            // }
          )

        
      resolve()
         
      } catch (error) {
        console.log(error);
      }
    });
  },

  getCategoryDetails: (cateId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.categories.findOne({ _id: cateId }).then((categories) => {
          resolve(categories);
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getCouponDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.coupon.findOne({ _id: id }).then((coupon) => {
          resolve(coupon);
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  deleteCategory: (cateId) => {
    return new Promise((resolve, reject) => {
      try {
        db.categories.deleteOne({ _id: cateId }).then(() => {
          resolve();
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getOrderDetails: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db.order.aggregate([
          {
            $unwind: "$orders",
          },
        ]);
        resolve(orders);
      } catch (error) {
        console.log(error);
      }
    });
  },

  addbanner: (details) => {
    return new Promise(async (resolve, reject) => {
      try{
        let data = await db.banner(details);
        data.save();
        resolve(data);
      }catch(error){
        console.log(error);
      }
     
    });
  },
  getBanner: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await db.banner.find({});
        resolve(data);
      } catch (error) {
        console.log(error);
      }
    });
  },
  deleteMainBanner: (dataId) => {
    return new Promise((resolve, reject) => {
      try {
        db.banner.deleteOne({ _id: dataId }).then((res) => {
          resolve({success:true});
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  addwishlist: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let prodObj = {
          item: proId,
        };

        let userWishlist = await db.wishlist.findOne({ user: userId });
        //checking if user have wish list or not
        if (userWishlist) {
          let proExist = userWishlist.products.findIndex((i) => i.item == proId);
          console.log(proExist, "pro index");
          //checking if the pro is already exist
          if (proExist == -1) {
            db.wishlist
              .updateOne(
                {
                  user: userId,
                },
                {
                  $push: { products: prodObj },
                }
              )
              .then(() => {
                resolve({ status: "success" });
              });
          
          } else {
       
            resolve({ status: "failed" });
          }
        } else {
          let wishlistObj = {
            user: userId,
            products: [prodObj],
          };
          let data = await db.wishlist(wishlistObj);
          await data.save();
          resolve({ status: "success" });
        }
      } catch (err) {
        console.log(err);
      }
    });
  },

  getAllWishlist: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        db.wishlist.aggregate([
          {
            $match: { user: userId },
          },
          {
            $unwind: "$products",
          },
          {
            $project: { item: "$products.item" },
          },
          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "productInfo",
            },
          },
          {
            $project: {
              item: 1,
              products: { $arrayElemAt: ["$productInfo", 0] },
            },
          },
        ]).then((data)=>{

         resolve(data,"/////////[[]]//")

        })
      } catch (error) {
        console.log(error);
      }
    });
  },

  deleteWishList:(data)=>{
   return new Promise((resolve,reject)=>{

try {
  
  db.wishlist.updateOne(
    {_id:data.wishlist},
    {
      $pull:{ products:{item:data.product} }
    }).then((response)=>{
     
      resolve(response)
    })

} catch (error) {
  
  console.log(error);
}


   })
  },

  addCateBanner:(data)=>{
    return new Promise(async(resolve, reject) => {
      try {
        
let cata=await db.cataBanner(data)
cata.save()
resolve(cata)

      } catch (error) {
        
      }
    })
  },
  getCataBanner:()=>{
    return new Promise(async(resolve, reject) => {
      try {

       let cata=await db.cataBanner.find({})
       resolve(cata)
        
      } catch (error) {
        
      }
    })
  },

  deleteCateBanner:(cateId)=>{

    return new Promise((resolve, reject) => {
      try{
        db.cataBanner.deleteOne({_id:cateId}).then(()=>{
          resolve()
        })
      }catch(error){
        console.log(error);
      }
    
    })

  }
};
