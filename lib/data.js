const fs = require("fs")
const path = require("path")
const helpers = require("./helpers")


// create a lib
const lib = {}

// create a path 
lib.baseDir = path.join(__dirname, "/../.data/")

// create a new file 
lib.create = function(dir, file, data, callback) {
    // open a new file or create a new file 
    fs.open(lib.baseDir+dir+"/"+file+".json", "wx", function(err, fileDescriptor) {

        // if no error and there is a fileDescriptor, convert the data to json and write to file 
        if (!err && fileDescriptor) {

            // convert the data to a json 
            let stringData = JSON.stringify(data)

            // write to the file
            fs.writeFile(fileDescriptor, stringData, function(err) {
                // if no error, close the file
                if (!err) {
                    fs.close(fileDescriptor, function(err){
                        if (!err) {
                            callback(false)
                        } else {
                            callback("There is an error closing the file")
                        }
                    })
                } else {
                    callback("There is an error writing to the file.")
                }
            })
        } else {
            console.log(err)
            callback("Could not create a new file, file may already exit.")
        }
    })
}

// reading from a file 
lib.read = function(dir,file, callback) {
    fs.readFile(lib.baseDir+dir+"/"+file+".json", "utf8",function(err, data) {
        if(!err && data) {
            const parseData = helpers.parseJsonToObject(data)
            callback(false, parseData)
        } else {
            callback(err, data)
        }
    })
}


// updating a file 
lib.update = function (dir, file, data, callback) {
    // open the file, and throw error if it doesn't exit 
    fs.open(lib.baseDir+dir+"/"+file+".json", "r+", function(err, fileDescriptor) {

        // stringnify the data 
        const stringData = JSON.stringify(data)
        
        if (!err) {
            // truncate the file 
            fs.ftruncate(fileDescriptor, function(err) {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if(!err) {
                            // close the file 
                            fs.close(fileDescriptor, function(err) {
                                if (!err) {
                                    callback(false)
                                } else {
                                    callback("There is error closing the file.")
                                }
                            })
                        } else {
                            callback("There is error closing the file.")
                        }
                    })
                } else {
                    callback("Error truncating the file")
                }
            }) 
        } else {
            callback("File not exit")
        }
    })
}


lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir+dir+"/"+file+".json", function(err) {
        if(!err) {
            callback(false)
        } else {
            callback("File can not be deleted, it's either it does not exist or incorrect path")
        }
    })
}


// export the lib 
module.exports = lib 
