var bcrypt = require("bcrypt");
var db = require("../config/connection");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");

require("dotenv").config();

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let user = await db.user.findOne({ email: userData.email });
        if (user) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status && user.status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else if (!user.status) {
              response.blocked = true;
              resolve(response);
            } else {
              console.log("password failed");
              resolve({ status: false });
            }
          });
        } else {
          console.log("failed no exist user");
          resolve({ status: false });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },

  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // await User.findOne({ "$or": [ { email: email }, { phone: phone} ] })
        db.user
          .find({ $or: [{ email: userData.email }, { phone: userData.phone }] })
          .then(async (data) => {
            let response = {};
            if (data.length != 0) {
              resolve({ status: false });
            } else {
              userData.password = await bcrypt.hash(userData.password, 10);

              let data = db.user(userData);
              data.save();
              response.value = userData;
              response.status = true;
              response.data = data.insertedId;
              resolve(response);
            }
          });
      } catch (error) {
        console.log(error);
      }
    });
  },
  addToCart: (proId, userId) => {
    prodObj = {
      item: proId,
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db.cart.findOne({ user: userId });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (products) => products.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.cart
            .updateOne(
              { user: userId, "products.item": proId },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.cart
            .updateOne(
              { user: userId },
              {
                $push: { products: prodObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        cartObj = {
          user: userId,
          products: [prodObj],
        };

        console.log(cartObj);
        let data = await db.cart(cartObj);
        data.save((err, data) => {
          if (err) {
            console.log(err);
          } else {
            resolve(data);
          }
        });
        console.log(data);
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        db.cart
          .aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
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
                quantity: 1,
                products: { $arrayElemAt: ["$productInfo", 0] },
              },
            },
          ])
          .then((product) => {
            resolve(product);
          });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getCartCount: (userId) => {
    let count = 0;

    return new Promise(async (resolve, reject) => {
      try {
        let cart = await db.cart.findOne({ user: userId });
        if (cart) {
          for (i = 0; i < cart.products.length; i++) {
            count += cart.products[i].quantity;
          }
        }
        console.log(count, "count refresh");
        count = parseInt(count);
        resolve(count);
      } catch (error) {
        console.log(error);
      }
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      try {
        if (details.count == -1 && details.quantity == 1) {
          db.cart
            .updateOne(
              { _id: details.cart },
              {
                $pull: { products: { item: details.product } },
              }
            )
            .then((response) => {
              console.log(response);
              resolve({ removeProduct: true });
            });
        } else {
          db.cart
            .updateOne(
              { _id: details.cart, "products.item": details.product },
              {
                $inc: { "products.$.quantity": details.count },
              }
            )
            .then((response) => {
              console.log(response);

              resolve({ status: true });
            });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },
  removeProductFromCart: (details) => {
    return new Promise((resolve, reject) => {
      try {
        db.cart
          .updateOne(
            { _id: details.cart },
            {
              $pull: { products: { item: details.product } },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getTotalAmmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.cart.aggregate([
        {
          $match: { user: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
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
            quantity: 1,
            products: { $arrayElemAt: ["$productInfo", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$products.price"] } },
            offertotal: {
              $sum: { $multiply: ["$quantity", "$products.offerprice"] },
            },
          },
        },
      ]);

      resolve(total[0]);
    });
  },

  placeOrder: (order, total, couponId, couponamount) => {
    return new Promise(async (resolve, reject) => {
      try {
        let components = await db.cart.aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "cartItemsResult",
            },
          },
          {
            $unwind: "$cartItemsResult",
          },
          {
            $set: { cartItemsResult: { status: true } },
          },
          {
            $set: { cartItemsResult: { shippingStatus: 1 } },
          },
          {
            $project: {
              _id: "$cartItemsResult._id",
              quantity: 1,
              productsName: "$cartItemsResult.name",
              offerprice: "$cartItemsResult.offerprice",
              productprice: "$cartItemsResult.price",
              status: "$cartItemsResult.status",
              shippingStatus: "$cartItemsResult.shippingStatus",
              img: "$cartItemsResult.img",
            },
          },
        ]);

        let totalQuantity = 0;
        for (i = 0; i < components.length; i++) {
          totalQuantity += components[i].quantity;
        }
        let Address = {
          firstname: order.firstname,
          lastname: order.lastname,
          country: order.country,
          street: order.street,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          phone: order.phone,
          email: order.email,
        };

        let addressObj = {
          user: order.userId,
          address: Address,
        };

        // change stock after order

        for (i = 0; i < components.length; i++) {
          await db.product.updateOne(
            {
              _id: components[i]._id,
            },
            {
              $inc: { stock: -components[i].quantity },
            }
          );
        }

        let addr = await db.address.findOne({ user: order.userId });

        if (addr) {
          db.address.find({ "address.phone": order.phone }).then((res) => {
            if (res.length == 0) {
              db.address
                .updateOne(
                  { user: order.userId },
                  {
                    $push: {
                      address: Address,
                    },
                  }
                )
                .then((res) => {
                  resolve();
                });
            }
          });
        } else {
          db.address(addressObj)
            .save()
            .then(() => {
              resolve();
            });
        }

        let orderAddress = {
          street: order.street,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          phone: order.phone,
          email: order.email,
        };

        console.log(totalQuantity, "this i my total quantity");
        let orderObj = {
          userId: order.userId,
          firstname: order.firstname,
          lastname: order.lastname,
          phone: order.phone,
          paymentMethod: order.payment,
          productDetails: components,
          totalPrice: total, //////////////////////////////////////////////////
          totalQuantity: totalQuantity,
          shippingAddress: orderAddress,
          couponAmount: couponamount,
        };
        let orderdata = {
          userId: order.userId,
          orders: orderObj,
        };
        let orderExist = await db.order.find({ userId: order.userId });

        if (!orderExist.length == 0) {
          db.order
            .updateOne(
              {
                userId: order.userId,
              },
              {
                $push: {
                  orders: [
                    {
                      firstname: order.firstname,
                      lastname: order.lastname,
                      phone: order.phone,
                      paymentMethod: order.payment,
                      productDetails: components,
                      totalPrice: total, /////////////////////////////////////////////////////
                      totalQuantity: totalQuantity,
                      shippingAddress: orderAddress,
                      couponAmount: couponamount,
                    },
                  ],
                },
              }
            )
            .then(() => {
              // db.cart.deleteOne({user:order.userId}).then((res) => {
              //   resolve({ status: "success" });
              // });
            });
        } else {
          db.order(orderdata).save();
          // db.cart.deleteOne({}).then((res) => {
          //   resolve({ status: "success" });
          // });
        }

        db.cart.deleteOne({ user: order.userId }).then((res) => {
          if (couponId) {
            console.log(couponId, order.userId, "my data for coupon");
            db.user
              .updateOne(
                { _id: order.userId, "coupon.couponId": ObjectId(couponId) },
                {
                  $set: {
                    "coupon.$.status": true,
                  },
                }
              )
              .then((data) => {
                console.log(data, "setting coupon true");
                resolve({ status: "success" });
              });
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getorders: (userId) => {
    return new Promise((resolve, reject) => {
      db.order.findOne({ userId: userId }).then((orderitems) => {
        resolve(orderitems);
      });
    });
  },

  cancelOrder: (data, userId) => {
    console.log(data, "dddddda");
    let orderIds = data.orderId.trim();

    return new Promise(async (resolve, reject) => {
      let orderDetails = await db.order.find({ userId: userId });
      console.log("orderDetails =>", orderDetails);

      console.log("newwwwww", orderDetails[0]);
      if (orderDetails) {
        let orderIndex = orderDetails[0].orders.findIndex(
          (order) => order._id == `${orderIds}`
        );
        console.log(orderIndex, "order index");
        let productIndex = orderDetails[0].orders[
          orderIndex
        ].productDetails.findIndex((product) => product._id == data.productId);
        console.log(productIndex, "pro index");
        db.order
          .updateOne(
            {
              "orders._id": data.orderId,
            },
            {
              $set: {
                ["orders." +
                orderIndex +
                ".productDetails." +
                productIndex +
                ".status"]: false,
              },
            }
          )
          .then(async (res) => {
            console.log(res, ">>>>>>>>>>>");
          });

        db.order
          .aggregate([
            {
              $match: {
                userId: userId,
              },
            },
            {
              $unwind: "$orders",
            },
            {
              $unwind: "$orders.productDetails",
            },
            {
              $match: {
                $and: [
                  {
                    "orders._id": ObjectId(data.orderId),
                    "orders.productDetails._id": ObjectId(data.productId),
                  },
                ],
              },
            },
          ])
          .then((aggrData) => {
            console.log(aggrData, "aggdata");
            let priceToWallet = {
              price: 0,
            };

            let totalPrice =
              aggrData[0].orders.productDetails.offerprice *
              aggrData[0].orders.productDetails.quantity;
            if (aggrData[0].orders.totalPrice - totalPrice < 0) {
              priceToWallet.price = aggrData[0].orders.totalPrice;
            } else {
              priceToWallet.price = totalPrice;
            }

            // CHECK IF THE PAYMENT METHOD IS COD OR NOT

            if (
              aggrData[0].orders.paymentMethod == "razorpay" ||
              aggrData[0].orders.paymentMethod == "paypal"
            ) {
              console.log("wallet update called");
              db.user
                .updateOne(
                  { _id: userId },
                  {
                    $inc: {
                      wallet: parseInt(priceToWallet.price),
                    },
                  }
                )
                .then((upw) => {
                  console.log(upw, "wallet updated");
                });
            }
          });

        let quantity = await orderDetails[0].orders[orderIndex].productDetails[
          productIndex
        ].quantity;

        db.product
          .updateOne(
            { _id: data.productId },
            {
              $inc: { stock: quantity },
            }
          )
          .then(() => {
            resolve({ status: true });
          });
      }
    });
  },
  getaddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db.address.find({ user: userId });

      resolve(address);
    });
  },
  filladress: (userId, addressId) => {
    return new Promise((resolve, reject) => {
      //    console.log('user'.userId,'_id',addressId)
      db.address
        .aggregate([
          {
            $match: { user: userId },
          },
          {
            $unwind: "$address",
          },
          {
            $match: { "address._id": ObjectId(addressId) },
          },
        ])
        .then((data) => {
          resolve(data);
        });
    });
  },

  generatRazorpay: async (userid, total) => {
    let order = await db.order.find({ userId: userid });
    console.log(order, "user order");
    let orderId = order[0].orders.slice().reverse();
    orderId = orderId[0]._id;
    console.log(orderId, "this is order id");
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("new order:", order);
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "Y8ZLXIMBUbuT28CeqB6FWu1L");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId, userid) => {
    console.log(orderId, "<=", userId, "<=");
    return new Promise(async (resolve, reject) => {
      let orders = await db.order.find({ userId: userid });
      console.log(orders, "order doc");
      let orderIndex = orders[0].orders.findIndex(
        (order) => order._id == orderId
      );
      console.log(orderIndex, "exact order");
      // let updateData = await
      db.order
        .updateOne(
          {
            "orders._id": orderId,
          },
          {
            $set: {
              ["orders." + orderIndex + ".paymentStatus"]: 1,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  removeAddress: (addressId, userId) => {
    console.log("daaaata", addressId, userId);
    return new Promise((resolve, reject) => {
      db.address
        .updateOne(
          { user: userId },
          {
            $pull: {
              address: { _id: addressId },
            },
          }
        )
        .then((data) => {
          console.log("mmmmm", data);
          resolve(data);
        });
    });
  },
  userdetails(userId) {
    return new Promise((resolve, reject) => {
      db.user.findOne({ _id: userId }).then((res) => {
        resolve(res);
      });
    });
  },
  addressAdd: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let addressExist = await db.address.find({ user: userId });
        if (addressExist) {
          db.address
            .find({
              "address.pincode": data.pincode,
              "address.phone": data.phone,
            })
            .then((res) => {
              if (res.length == 0) {
                db.address
                  .updateOne(
                    { user: userId },
                    {
                      $push: { address: data },
                    }
                  )
                  .then((res) => {
                    resolve({ status: true });
                  });
              } else {
                resolve({ status: false });
              }
            });
        } else {
          db.address(data)
            .save()
            .then(() => {
              resolve({ status: true });
            });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },

  checkCartQuantity: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cart = await db.cart.findOne({ user: userId });
        console.log(cart, "namma cart");
        if (cart) {
          let cartIndex = cart?.products?.findIndex(
            (cart) => cart.item == proId
          );
          if (cartIndex == -1) {
            let quantity = 0;
            resolve({ status: true, quantity: quantity });
          } else {
            let quantity = cart.products[cartIndex]?.quantity;
            resolve({ status: true, quantity: quantity });
          }
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },
  updateAddress: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await db.address.find({ user: userId });
        console.log(address, " address");
        console.log(data._id, "address id");
        let addressIndex = address[0].address.findIndex(
          (index) => index._id == data._id
        );
        console.log(addressIndex, " address index");
        let addressData = {
          firstname: data.firstname,
          lastname: data.lastname,
          country: data.country,
          street: data.street,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
        };

        db.address
          .updateOne(
            {
              user: userId,
            },
            {
              $set: {
                ["address." + addressIndex]: addressData,
              },
            }
          )
          .then((data) => {
            resolve();
          });
      } catch (error) {
        console.log(error);
      }
    });
  },

  editProfile: (data, user) => {
    // console.log(data, user, "body", "user");
    return new Promise((resolve, reject) => {
      try {
        bcrypt
          .compare(data.currentpassword, user.password)
          .then(async (checkpassword) => {
            // console.log(checkpassword, "check pass");
            if (checkpassword) {
              data.newpassword = await bcrypt.hash(data.newpassword, 10);

              db.user
                .updateOne(
                  { _id: user._id },
                  {
                    $set: {
                      name: data.firstname,
                      email: data.email,
                      password: data.newpassword,
                    },
                  }
                )
                .then((response) => {
                  // console.log(response, "response");

                  resolve({ status: true });
                });
            } else {
              console.log("password failed");
              resolve({ status: false });
            }
          });
      } catch (error) {
        console.log(error);
      }
    });
  },

  getdata: (orderId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // let orders = await db.order.find({ userId: userId });
        db.order
          .aggregate([
            {
              $match: { userId: userId },
            },
            {
              $unwind: "$orders",
            },
            {
              $match: { "orders._id": ObjectId(orderId) },
            },
          ])
          .then((data) => {
            resolve(data);
          });
      } catch (error) {
        console.log(error);
      }
    });
  },

  returnProduct: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await db.order.find({ userId: userId });
        console.log(order, "ordersss");
        // let flag = 1
        if (order) {
          let orderIndex = order[0].orders.findIndex(
            (order) => order._id == data.orderId
          );
          console.log(orderIndex, "or index");
          let productIndex = order[0].orders[
            orderIndex
          ].productDetails.findIndex((product) => product._id == data.proId);
          console.log(productIndex, "pro index");
          await db.order.updateOne(
            {
              userId: userId,
            },
            {
              $set: {
                ["orders." +
                orderIndex +
                ".productDetails." +
                productIndex +
                ".shippingStatus"]: 5,
                ["orders." +
                orderIndex +
                ".productDetails." +
                productIndex +
                ".status"]: false,
              },
            }
          );

          db.order
            .aggregate([
              {
                $match: { "orders._id": ObjectId(data.orderId) },
              },
              {
                $unwind: "$orders",
              },
              {
                $unwind: "$orders.productDetails",
              },
              {
                $match: {
                  $and: [
                    {
                      "orders._id": ObjectId(data.orderId),
                      "orders.productDetails._id": ObjectId(data.proId),
                    },
                  ],
                },
              },
            ])
            .then((aggrData) => {
              console.log(aggrData, "agg data");
              let priceToWallet = {
                price: 0,
              };

              let totalPrice =
                aggrData[0].orders.productDetails.offerprice *
                aggrData[0].orders.productDetails.quantity;
              console.log(totalPrice, "total price");
              // checking coupon and offer price to be returned
              if (aggrData[0].orders.totalPrice - totalPrice < 0) {
                priceToWallet.price = aggrData[0].orders.totalPrice;
              } else {
                priceToWallet.price = totalPrice;
              }

              db.product
                .updateOne(
                  { _id: data.proId },
                  {
                    $inc: { stock: aggrData[0].orders.productDetails.quantity },
                  }
                )
                .then((e) => {
                  console.log(e, "this one");
                });

              db.user
                .updateOne(
                  { _id: userId },
                  {
                    $inc: {
                      wallet: parseInt(priceToWallet.price),
                    },
                  }
                )
                .then((e) => {
                  console.log(e, "walll");
                  resolve({ status: true });
                });
            });
        } else {
          resolve({ status: false });
        }
      } catch (err) {
        console.log(err);
      }
    });
  },
  isUser: (number) => {
    return new Promise((resolve, reject) => {
      db.user
        .findOne({ phone: number })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  changePassword: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      data.newpassword = await bcrypt.hash(data.newpassword, 10);
      db.user
        .updateOne(
          { _id: userId },
          {
            $set: {
              password: data.newpassword,
            },
          }
        )
        .then(() => {
          resolve({ status: true });
        });
    });
  },

  // returnProduct: (data, userId) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       let order = await db.order.findOne({ userId: userId });
  //       console.log(order, "order");
  //       if (order) {
  //         let orderIndex = order.orders.findIndex( (index) => index._id == data.orderId);
  //         let productIndex = order.orders[orderIndex].productDetails.findIndex((index) => index._id == data.proId);

  //       let thisOrder = await db.order.findOne({ "orders._id": data.orderId });

  //       if (!thisOrder.orders[orderIndex].productDetails[productIndex].return) {
  //         db.order
  //           .updateOne(
  //             {
  //               "orders._id": data.orderId,
  //             },
  //             {
  //               $set: {
  //                 ["orders." +
  //                 orderIndex +
  //                 ".productDetails." +
  //                 productIndex +
  //                 ".return"]: true,
  //               },
  //             }
  //           )
  //           .then((e) => {
  //             console.log(e);
  //           });
  //         db.order.aggregate([
  //           {
  //             $match: { userId: data.userId },
  //           },
  //           {
  //             $unwind: "$orders",
  //           },
  //           {
  //             $unwind: "$orders.productDetails",
  //           },
  //           {
  //             $match: {
  //               $and: [
  //                 {
  //                   "orders._id": ObjectId(data.orderId),
  //                   "orders.productDetails._id": ObjectId(data.proId),
  //                 },
  //               ],
  //             },
  //           },
  //         ]).then((data)=>{
  //           let priceWallet={
  //             price:0,
  //           }
  //           let totalPrice= data[0].orders.productDetails.quantity * data[0].orders.productDetails.price
  //           priceWallet.price=totalPrice

  //           db.product.updateOne(
  //             {_id:ObjectId(data.proId) },
  //             { $inc:{stock:data[0].orders.productDetails.quantity}}
  //             ).then((e)=>{
  //               console.log("pro stck updated");
  //             })
  //            db.user.updateOne(
  //             {
  //                    _id:userId
  //             },
  //             {
  //               $push:{wallet:totalPrice}
  //             }
  //             ).then((e)=>{
  //               console.log("price added to wallet");
  //               resolve({status:true})
  //             })

  //         })
  //       }else{
  //         console.log("pro already returned");
  //         resolve({status:})
  //       }
  //     } catch {

  //     }
  //   });
  // },
};
