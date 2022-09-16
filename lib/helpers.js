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



// export method 
module.exports = helpers
