const _data = require("./data");
const helpers = require("./helpers.js")
const config = require("../config")


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

// user post handlers
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


// user get handlers 
handler._users.get = (data, callback) => {
    const phone = typeof(data.queryStringObj.phone) == "string" && data.queryStringObj.phone.trim().length > 0 ? data.queryStringObj.phone.trim() : false
    if (phone) {
        // read data

        const tokenId = typeof (data.header.token) == "string" ? data.header.token.trim() : false

        handler._tokens.verifyToken(tokenId, phone, (verifyToken) => {
            if (verifyToken) {
                // return data
                _data.read("users", phone, function(err, data) {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, data)
                    } else {
                        callback(404)
                    }
                })
            } else {
                callback(403, {"Error" : "Missing token, or invalid token."})
            }
        })
    } else {    
        callback(400,{'Error' : 'Missing required field'})
    }    
}

// user update handlers
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

            const tokenId = typeof (data.header.token) == "string" ? data.header.token.trim() : false

            handler._tokens.verifyToken(tokenId, phone, (verifyToken) => {
                if (verifyToken) {
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
                                userData.hashedPassword = helpers.hash(password)
                            }
        
                            _data.update("users", phone, userData, (err) => {
                                if (!err) {
                                    // since user update their password, the current token should expired so that user can revalidate their authentication
                                    _data.read("tokens", tokenId, (err, tokenData) => {
                                        if (!err) {
                                            // expire the token instantly by reducing the duration by one hour 
                                            tokenData.expires = Date.now() - 1000 * 60 * 60;
                                            _data.update("tokens", tokenId, tokenData, (err) => {
                                                if (!err) {
                                                    callback(200)
                                                } else {
                                                    callback(500, {"Error" : "Token can not be updated."})
                                                }
                                            })
                                        } else {
                                            callback(400, {"Error" : "Token not found or expired"})
                                        }
                                    })
                                    // callback(200)
                                } else {
                                    callback(500, {"Error" : "Could not update user."})
                                }
                            })
                        } else {
                            callback(400, {"Error" : "Specified user does not exist."})
                        }
                    })
                }else {
                    callback(403, {"Error" : "Missing token, or invalid token."})
                }
            })
        } else {
            callback(400, {"Error" : "You can send empty field"})
        }
    } else {
        callback(404, {"Error" : "User not found."})
    }
}


// user delete handlers
handler._users.delete = (data, callback) => {
    // search for the user
    const phone = typeof(data.queryStringObj.phone) == "string" && data.queryStringObj.phone.trim().length > 0 ? data.queryStringObj.phone.trim() : false

    // check if the phone exit

    if (phone) {
        // read the database 

        const tokenId = typeof (data.header.token) == "string" ? data.header.token.trim() : false

            handler._tokens.verifyToken(tokenId, phone, (verifyToken) => {
                if (verifyToken) {
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
                }else {
                    callback(403, {"Error" : "Missing token, or invalid token."})
                }
            })
    } else {
        callback(400, {"Error" : "User not found."})
    }
}


handler.tokens = (data, callback) => {
    const acceptableMethod = ["get", "post", "put", "delete"]
    if (acceptableMethod.indexOf(data.method) > -1){
        handler._tokens[data.method](data, callback)
    } else {
        callback("Method is not acceptable")
    }
}

handler._tokens = {}

// token post handler
handler._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    if (phone) {
        // read the data for the user
        _data.read("users", phone, (err, userData) => {
            if(!err && userData) {
                // console.log({userData})
                // check the user password against the stored password 
                const hashedPassword = helpers.hash(password)
                if (hashedPassword === userData.hashedPassword) {
                    // create the token 
                    const tokenId = helpers.createRandomString(20)
                    console.log({tokenId})
                    if (tokenId) {
                        const expires = Date.now() + 1000 * 60 * 60;
                        const tokenObject = {
                            phone : phone,
                            tokenId : tokenId,
                            expires : expires
                        }

                        _data.create("tokens", tokenId, tokenObject, (err) => {
                            if (!err) {
                                // create token file and saved 
                                callback(200, tokenObject)
                            } else {
                                callback(500, {"Error" : "Could not create a token."})
                            }
                        })
                    } else {
                        callback(500, {"Error" : "Could not create token."})
                    }
                } else{
                    callback(400, {"Error" : "Password cannot be verified."})
                }
            } else {
                callback(404, {"Error" : "User cannot be find."})
            }
        })
    } else {
        callback(400, {"Error" : "Missing required field."})
    }
}

// token get handler 
handler._tokens.get = (data, callback) => {
    const id = typeof(data.queryStringObj.id) == "string" && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id : false;

    if (id) {
        // read the data storage
        _data.read("tokens", id, (err, tokenData) => {
            if (!err) {
                // return token and status code 
                callback(200, tokenData)
            } else {
                // return 404
                callback(400, {"Error" : "Token not found or expired"})
            }
        })
    } else {
        callback(400, {"Error" : "Missing required field."})
    }
}


// token put handler 
handler._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == "boolean" && data.payload.extend == true ? true : false;

    if (id && extend) {
        // read the token 

        _data.read("tokens", id, (err, tokenData) => {
            // check if token is not expired
            console.log({tokenData})
            if (tokenData.expires > Date.now()) {
                // increase expiration time 
                tokenData.expires = Date.now() + 1000 * 60 * 60;

                _data.update("tokens", id, tokenData, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        // token can not be extended 
                        callback(500, {"Error" : "Token can not be extended."})
                    }
                })
            } else {
                // token expired 
                callback(400, {"Error" : "Token has already expired."})
            }
        })
    } else {
        // return missing field
        callback(400, {"Error" : "Missing required field."})
    }
}

// token delete handler 
handler._tokens.delete = (data, callback) => {
    const id = typeof(data.queryStringObj.id) == "string" && data.queryStringObj.id.trim().length ? data.queryStringObj.id : false;

    if (id) {
        // read token from storage 

        _data.read("tokens", id, (err, tokenData) => {
            if(!err && tokenData) {
                // delete token data 
                _data.delete("tokens", id, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500 , {"Error" : "Token could not be deleted."})
                    }
                }) 

            } else {
                callback(404, {"Error" : "Token not found."})
            }
        })
    } else {
        callback(400, {"Error" : "Missing required field."})
    }
}

handler._tokens.verifyToken = (id, phone, callback) => {
    _data.read("tokens", id, (err, tokenData) => {
        if (!err && tokenData) {
            // get the token data
            if (tokenData.expires > Date.now() && tokenData.phone == phone) {
                callback(true)
            } else {
                // return false 
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}



// checks
handler.checks = (data, callback) => {
    const acceptableMethod = ["get", "post", "put", "delete"]
    if (acceptableMethod.indexOf(data.method) > -1){
        handler._checks[data.method](data, callback)
    } else {
        callback("Method is not acceptable")
    }
}


// check object 
handler._checks = {}

handler._checks.post = (data, callback) => {
    const protocol = typeof(data.payload.protocol) == "string" && ["http", "https"].indexOf(data.payload.protocol.toLowerCase()) > -1 ? data.payload.protocol.toLowerCase() : false 
    const url = typeof(data.payload.url) == "string" &&  data.payload.url.trim().length >  0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == "string" && ["get", "post", "put", "delete"].indexOf(data.payload.method.toLowerCase()) > - 1 ? data.payload.method.toLowerCase() : false 
    const successCode = typeof(data.payload.successCode) == "object" && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false 
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == "number" && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds  : false

    if (protocol && url && method && successCode && timeoutSeconds) {
        // check the user token && token is valid 
        const tokenId = typeof (data.header.token) == "string" && data.header.token.trim().length == 20 ? data.header.token.trim() : false

        if (tokenId) {
            // read the token
            _data.read("tokens", tokenId, (err, tokenObject) => {
                if (!err && tokenObject) {

                    // verify if the token has not expired 
                    handler._tokens.verifyToken(tokenId, tokenObject.phone, (verifyToken) => {
                        if (verifyToken) {

                            const userPhoneNumber = tokenObject.phone

                            // read the user number from token data 
                            _data.read("users", userPhoneNumber, function(err, userData) {
                                if (!err && userData) {

                                    // check if the user checks is available and is [], else create a default array  
                                    const userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : []
                                    
                                    if (userChecks.length < config.maxChecks){
                                        // create checks object 

                                        const checkId = helpers.createRandomString(20)

                                        const checksObject = {
                                            id : checkId,
                                            protocol : protocol,
                                            url : url,
                                            method : method,
                                            successCode : successCode,
                                            timeoutSeconds : timeoutSeconds,
                                            userPhoneNumber : userPhoneNumber
                                        }

                                        // save user checks object to disk 

                                        _data.create("checks", checkId, checksObject, (err) => {
                                            if (!err) {
                                                // update the user to have the checkId in its check array 

                                                userData.checks = userChecks
                                                userData.checks.push(checkId)

                                                // update the userData in disk 
                                                _data.update("users", userPhoneNumber, userData, (err) => {
                                                    if (!err) {
                                                        callback(201, {"Success" : checksObject})
                                                    } else {
                                                        callback(500, {"Error" : "Can not update user data"})
                                                    }
                                                } )

                                            } else {
                                                callback(500, {"Error" : "Can not create a checks"})
                                            }
                                        })

                                    } else {
                                        callback(400, {"Error" : `Checks can not be more than ${config.maxChecks}`})
                                    }


                                } else {
                                    callback(404)
                                }
                            })
                        } else {
                            callback(403, {"Error" : "Missing token, or invalid token."})
                        }
                    })

                } else{
                    callback(400, {"Error" : "Token not found."})
                }
            })
            
        } else {
            callback(401, {"Error" : "Token is missing, or invalid token."})
        }
    } else {
        callback(400, {"Error" : "Missing required input, or input is invalid"})
    }
}

handler._checks.get = () => {

}

handler._checks.put = () => {

}

handler._checks.delete = () => {
    
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