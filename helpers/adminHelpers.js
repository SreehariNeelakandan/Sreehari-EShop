var db = require('../config/connection')
var adminData = require('../config/admin-connection')
const bcrypt=require('bcrypt');
const { ObjectID } = require('bson');

let data=adminData.adminId
module.exports = {


      getUserDetails: (pageCount,perPage) => {
        return new Promise(async (resolve, reject) => {
            let docCount;
            let user = await db.user.find({})
            .countDocuments()
            .then(documents=>{
                console.log(documents,"og doc");
                docCount=documents
                return  db.user.find({})
                .skip((pageCount-1)*perPage)
                .limit(perPage)
            })
            .then(user=>{
                console.log(docCount,"doc ccc");
                console.log(user,"page user");
                resolve({user,docCount})
            })
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let update = await db.user.updateOne({ _id: userId }, {
                $set: {
                    status:false
                }
            });
            resolve(update)

        })
    },unBlockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let update = await db.user.updateOne({ _id: userId }, {
                $set: {
                    status:true
                }
            });
            resolve(update)

        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve, reject) => {
         console.log(userData);

           if(data.email == userData.email){
              bcrypt.compare(userData.password, data.password).then((loginTrue)=>{
               
                 let response={}
                 if(loginTrue){
                    console.log('login successful');
                    response.admin=data;
                    response.status=true;
                    resolve(response);
                 }else{
                    console.log("login failed");
                    resolve({status:false});
                 }
              })
           }else{
              console.log('Login failed email');
               resolve({status:false});
           }
           
        })
   },
   orderDetails:(orderId)=>{
     return new Promise(async(resolve, reject) => {
        let order=await db.order.aggregate([
            {
                $unwind:'$orders'
            },
            {
                $unwind:'$orders.productDetails'
            },
            {
                $match:{'orders._id':ObjectID(orderId)}
            }
        ])
        resolve(order)
     })

   },
   
   shippingStatus:(value,orderId,proId)=>{
    
    let updatedVlue = parseInt(value)
        console.log(data);
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.order.find({ 'orders._id': orderId })
            console.log("orderDetails =>", orderDetails);

            if (orderDetails) {

                let orderIndex = orderDetails[0].orders.findIndex(order =>order._id == orderId)
               
                let productIndex = orderDetails[0].orders[orderIndex].productDetails.findIndex(product => product._id == proId)

                db.order.updateOne(
                    {
                        'orders._id':orderId
                    },
                    {
                        $set: {
                            ['orders.' + orderIndex + '.productDetails.' + productIndex + '.shippingStatus']: updatedVlue
                        }
                    }
                ).then((res) => {
                    console.log(res);
                    resolve({ status: true })
                })
            }

        })
   },

   doLogintwo:(adminData)=>{
    return new Promise(async (resolve, reject) => {
        let response = {}
        let admin = await db.admin.findOne({ email: adminData.email })
        console.log("namma admin",admin);
        if (admin) {
            bcrypt.compare(adminData.password, admin.password).then((status) => {
                if (status) {
                    response.admin =  admin
                    response.status = true
                    console.log("if succ");
                    resolve(response)
                    
                }
                else {
                    console.log("password failed");
                    resolve({ status: false })
                }
            })
        } else {
            console.log("failed no exist user");
            resolve({ status: false })
        }
    })
   },

}