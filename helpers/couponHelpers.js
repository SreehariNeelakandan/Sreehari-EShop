var db = require("../config/connection");

var voucher_codes = require("voucher-generator");
const { response } = require("../app");

module.exports = {
  generateCoupon: () => {
    try {
      return new Promise((resolve, reject) => {
        let voucherCode = voucher_codes.generate({
          length: 8,
          count: 1,
          prefix: "uptown-",
        });
        resolve({ voucherCode: voucherCode });
      });
    } catch (error) {
      console.log(error);
    }
  },

  saveCoupon: (data) => {
    return new Promise((resolve, reject) => {
      try {
        let couponData = db.coupon(data);
        couponData.save();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  getallcoupon: () => {
    return new Promise((resolve, reject) => {
      try {

       let allcoupons= db.coupon.find({})
       resolve(allcoupons)

      } catch (error) {
        console.log(error);
      }
    });
  },

  getCoupon:(couponId)=>{
    return new Promise(async(resolve, reject) => {
      try {
        
        let coupon = await db.coupon.findOne({_id:couponId})
                
                resolve(coupon)
      } catch (error) {
        console.log(error);
      }
    })
  },

  addCouponToUser:(userId,coupId,value)=>{
    return new Promise((resolve, reject) => {
    console.log(userId,"uuuu");
      db.user.findOne({_id:userId,'coupon.couponId':coupId}).then((response)=>{
         console.log("start",response,"kjhg");
        if(!response){

          let couponObj={
            couponId:coupId,
            status:value,
          };
          db.user.updateOne(
            {
            _id:userId,
            },
            {
              $push:{coupon:couponObj}
            }
          
          ).then(()=>{
            resolve()
          })
        }else{
          let couponIndex=response.coupon.findIndex(i=>i.couponId==""+coupId)
          
          console.log(couponIndex,'this is coupon');
          if(response.coupon[couponIndex].status){
            reject()
          }else{
            resolve()
          }
        }
      })
    })
  },
  removecoupon:(coupId)=>{
    return new Promise((resolve, reject) => {
      
      try {
        db.coupon.deleteOne({_id:coupId}).then((res)=>{
          resolve()
        })

      } catch (error) {
        
      }

    })
  }
};
