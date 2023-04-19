require("dotenv").config();

module.exports={ 
    serviceId:process.env.TWILIO_SERVICE_ID, 
    accountId:process.env.TWILIO_ACCOUNT_ID, 
    authToken:process.env.TWILIO_AUTH_TOKEN,
}