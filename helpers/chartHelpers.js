const db = require("../config/connection");

let arr = [];
module.exports = {
  priceGraph: () => {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < 12; i++) {
        let price = await db.order.aggregate([
          {
            $unwind: "$orders",
          },
          {
            $unwind: "$orders.productDetails",
          },
          {
              '$match': { 'orders.productDetails.shippingStatus': 4}
          },
          {
            $match: {
              $expr: {
                $eq: [
                  {
                    $month: "$orders.createdAt",
                  },
                  i + 1,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum:{$multiply:["$orders.productDetails.quantity","$orders.productDetails.offerprice"]}},
            },
          },
        ]);

        arr[i + 1] = price[0]?.total;
      }
      // console.log(arr);
      for (i = 0; i < arr.length; i++) {
        if (arr[i] == undefined) {
          arr[i] = 0;
        } else {
          arr[i];
        }
      }
      // console.log(arr)
      resolve(arr);
    });
  },

  paymentMethodGraph: () => {
    return new Promise((resolve, reject) => {
      db.order.aggregate(
        {
          $unwind: orders,
        },
        {
          _id: "orders.paymentMethod",
          count: { $sum: 1 },
        }
      );
    });
  },

  

  //Sales Report

  // monthlySales: () => {
  //   let date = new Date();
  //   let thisMonth = date.getMonth();

  //   return new Promise((resolve, reject) => {
  //     try {
  //       db.order
  //         .aggregate([
  //           {
  //             $unwind: "$orders",
  //           },
  //           {
  //             $unwind: "$orders.productsDetails",
  //           },
  //           {
  //             $match: { "orders.productsDetails.shippingStatus": 4 },
  //           },
  //           {
  //             $match: {
  //               $expr: {
  //                 $eq: [
  //                   {
  //                     $month: "$orders.createdAt",
  //                   },
  //                   thisMonth + 1,
  //                 ],
  //               },
  //             },
  //           },
  //           {
  //             $group: {
  //               _id: null,
  //               total: { $sum: "$orders.totalPrice" },
  //               orders: { $sum: "$orders.productsDetails.quantity" },
  //               totalOrders: { $sum: "$orders.totalQuantity" },
  //               count: { $sum: 1 },
  //             },
  //           },
  //         ])
  //         .then((data) => {
  //           // console.log(data)
  //           resolve({ status: true, data: data });
  //         });
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   });
  // },



  monthWiseSales: () => {

    let date = new Date();
    let thismonth = date.getMonth();
    let month = thismonth + 1;
    let year = date.getFullYear();
    

    return new Promise(async (resolve, reject) => {
          
      db.order.aggregate([
        {
          $unwind:'$orders'
        },
        {
          $unwind:'$orders.productDetails'
        },{
          $match:{'orders.createdAt':{$gt:new Date(`${year}-01-01`),$lt:new Date(`${year}-12-31`)}}
        },
        {
          $match:{'orders.productDetails.shippingStatus':4}
        },
        {
          $group:{
            _id:{'$month':"$orders.createdAt"},
            totalCount:{$sum:'$orders.totalPrice'},
           orders:{$sum:1},
           totalQuantity:{$sum:'$orders.productDetails.quantity'}
          }
        }
      ]).then((data)=>{
        console.log(data,"mmmm<><>");
        resolve(data)
      })

    });
  },

  dailysales: () => {
    
      try {
        let date = new Date();
        console.log(date,'676');
        let thismonth = date.getMonth();
        console.log(thismonth,'679');

        let month = thismonth +1;
        let year = date.getFullYear();
        return new Promise(async(resolve, reject) => {
            
            await db.order.aggregate([
                {
                    $unwind:'$orders'
                },
                {
                    $unwind:'$orders.productDetails'
                },
                {
                    $match:{'orders.createdAt':{
                        $gt:new Date(`${year}-${month}-00`),
                        $lt:new Date(`${year}-${month}-31`),
                        // $gt:new Date(`${year}-${month}-${ Date.getDate}`),
                        // $lt:new Date(`${year}-${month}-${ Date.getDate}`),

                    }}
                },
                {
                    $match:{'orders.productDetails.shippingStatus':4}
                },
                {
                $group:{
                    _id:{'$dayOfMonth':'$orders.createdAt'},
                    totalRevenue:{$sum:'$orders.totalPrice'},
                    orders:{$sum:1},
                    totalQuantity:{$sum:'$orders.productDetails.quantity'}
                    
                }
            },
            {
                $sort:{'_id':-1}
            }
            ]).then((data)=>{
              
                resolve(data)
            })
        })
      } catch (error) {
        console.log(error);
      }
   
  },

  yearlysales:()=>{
    let date = new Date();
    let thismonth = date.getMonth();
    let month = thismonth + 1;
    let year = date.getFullYear();

    return new Promise(async(resolve, reject) => {
        
        await db.order.aggregate([
            {
                $unwind:'$orders'
            },
            {
                $unwind:'$orders.productDetails'
            },
            {
                  $match:{'orders.createdAt':{$gt:new Date(`${year-5}-${month}-01`),$lt:new Date(`${year}-${month}-31`)}}
                // $match:{'orders.createdAt':{$gt:new Date(`${year-5}-${month}-${ Date.getDate}`),$lte:new Date(`${year}-${month}-${ Date.getDate}`)}}

            },
            {
                $match:{'orders.productDetails.shippingStatus':4}
            },
            {
                $group:{
                    _id:{'$year':'$orders.createdAt'},
                    totalRevenue:{$sum:'$orders.totalPrice'},
                    orders:{$sum:1},
                    totalQuantity:{$sum:'$orders.productDetails.quantity'}
                }
            },
            {
                $sort:{
                     '_id':1,
                }
            },

        ]).then((data)=>{
            console.log(data,'ayas');
            resolve(data)
        })
        
      

    })
  }
};
