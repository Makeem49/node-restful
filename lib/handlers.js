const _data = require("./data");
const helpers = require("./helpers.js")


// object that will contain all function to be called base on different router 
const handler = {}

handler.users = (data, callback) => {
    const acceptableMethod = ["get", "post", "put", "delete"]
    if (acceptableMethod.indexOf(data.method) > -1){
        handler._users[data.method](data, callback)
    } else {
        callback("Method is not acceptable")
    }
}

// method to be use internally 
handler._users = {}

// post handlers
handler._users.post = (data, callback) => {
    const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const phoneNumber = typeof(data.payload.phoneNumber) == "string" && data.payload.phoneNumber.trim().length > 0 ? data.payload.phoneNumber.trim() : false
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    const tosAgreement = typeof(data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement.length > 0 ? data.payload.tosAgreement.trim() : false
    console.log(firstName, lastName, phoneNumber, password, tosAgreement)
    if (firstName, lastName, phoneNumber, tosAgreement, password) {
        // Read the data storage to make sure the user is not 
        _data.read("users", phoneNumber, function(err, data){
            // will return an error if the user is not exist
            if (err) {
                // hash the user password 
                const hashedPassword = helpers.hash(password)
                
                // create a user object
                if (hashedPassword) {
                    const userObj = {
                        "firstName" : firstName,
                        "lastName" : lastName,
                        phone : phoneNumber,
                        hashedPassword : hashedPassword,
                        tosAgreement : true
                    }

                    // save the user inside the database
                    _data.create("users",  phoneNumber, userObj, (err) => {
                        if (!err) {
                            callback(201)
                        } else {
                            callback(500, {"Error" : "Could not create user"})
                        }
                    })
                } else {
                    callback(500, {"Error" : "Could not hash user password"})
                }
            } else {
                callback("400", {"Error" : "User already exist with phone number."})
            }
        })
        
    } else {
        callback(400, {"Error" : "Missing required field"})
    }
}


// get handlers 
handler._users.get = (data, callback) => {
    const phone = typeof(data.queryStringObj.phone) == "string" && data.queryStringObj.phone.trim().length > 0 ? data.queryStringObj.phone.trim() : false
    if (phone) {
        // read data
        _data.read("users", phone, function(err, data) {
            if (!err && data) {
                delete data.hashedPassword;
                callback(200, data)
            } else {
                callback(404)
            }
        })

    } else {    
        callback(400,{'Error' : 'Missing required field'})
    }    
}

// update handlers
handler._users.put = (data, callback) => {
    // search if the user is available 
    const phone = typeof(data.queryStringObj.phone) == "string" && data.queryStringObj.phone.length === 10 ? data.queryStringObj.phone : false 
    const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false 
    const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false 
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false 

    //  if phone is available 
    if (phone) {
        
        // check if any of the data is send with the request 
        if (firstName || lastName || password) {

            // read the file first
            _data.read("users", phone, (err, userData) => {
                if (!err) {
                    // check which attribute to update 
                    if (firstName) {
                        userData.firstName = firstName
                    }

                    if (lastName) {
                        userData.lastName = lastName
                    }

                    if (password) {
                        userData.password = helpers.hash(password)
                    }

                    _data.update("users", phone, userData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {"Error" : "Could not update user."})
                        }
                    })
                } else {
                    callback(400, {"Error" : "Specified user does not exist."})
                }
            })
        } else {
            callback(400, {"Error" : "You can send empty field"})
        }
    } else {
        callback(404, {"Error" : "User not found."})
    }
}


// delete handlers
handler._users.delete = (data, callback) => {
    // search for the user
    const phone = typeof(data.queryStringObj.phone) == "string" && data.queryStringObj.phone.trim().length > 0 ? data.queryStringObj.phone.trim() : false

    // check if the phone exit

    if (phone) {
        // read the database 

        _data.read("users", phone, (err, data) => {
            if (!err) {
                // delete the user from the database

                _data.delete("users", phone, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, {"Error" : "Could not delete the specified user."})
                    }
                })
            } else {
                callback(400, {"Error" : "User not found."})
            }
        })
    } else {
        callback(400, {"Error" : "User not found."})
    }
}

handler.ping = (data, callback) => {
    callback(200)
} 


// this handler wil be called if no route match any key in the router object 
handler.notFound = (data, callback) => {
    callback(404)
}


// module export 
module.exports = handler