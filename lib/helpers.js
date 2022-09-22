const crypto = require("crypto")
const config = require("../config")

const helpers = {}

helpers.hash = (str) => {
   if (typeof str == "string" && str.length  > 0) {
        const hashed = crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex")
        return hashed
   } else {
    return false
   }
}

helpers.parseJsonToObject = (str) => {
   try {
      const toObj = JSON.parse(str)
      return toObj
   } catch (error) {
      return {}
   }
}

helpers.createRandomString = (strLength) => {
   strLength = typeof(strLength) == "number" && strLength > 0 ? strLength : false;

   if (strLength) {
      // create token from random character
      const possibleRandomCharacter = "abcdefghijklmnopqrstuvwxyz1234567890";

      let token = "";

      for (let i = 0; i < strLength; ++i) {
         const random = possibleRandomCharacter.charAt(Math.floor(Math.random() * possibleRandomCharacter.length ))
         token += random
      }
      return token 
   } else {
      return false
   }
}



// export method 
module.exports = helpers
