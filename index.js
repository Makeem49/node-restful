// dependencies

// this impoort the http module
const http = require('http');
const https = require("https")
const url = require('url');
const fs = require("fs")
const StringDecoder = require('string_decoder').StringDecoder

const config = require("./config")
const _data = require("./lib/data")
const handler = require("./lib/handlers")
const helpers = require("./lib/helpers")


// http server logic
const httpServer = http.createServer(function(req, res) {
    commonServer(req, res)
})


// listening to http server 
httpServer.listen(config.httpPort, function(){
    console.log("http")
    console.log(`starting at port ${config.httpPort} in mode ${config.envName}`)
})


// https server logic 
const serverOptions = {
    "key" : fs.readFileSync("./https/key.pem"),
    "cert" : fs.readFileSync("./https/cert.pem")
}

const httpsServer = https.createServer(serverOptions, function(req, res) {
    commonServer(req, res)
})


// listening to https server 
httpsServer.listen(config.httpsPort, function(){
    console.log("https")
    console.log(`starting at port ${config.httpsPort} in mode ${config.envName}`)
})


// create a common server logic
const commonServer = function(req, res){
    // parsing url 
    const parsedURL = url.parse(req.url, true); // you can add true as second argument 
    // console.log({parsedURL})
    // console.log({res})

    // gettingg path 
    const path = parsedURL.pathname 
    
    // trimmed path
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // getting the method 
    const method = req.method.toLowerCase()

    // get query string object  
    const queryStringObj = parsedURL.query
    // console.log(queryStringObj.foo)

    // get the request headers
    const header = req.headers

    // getting payload data i.e the body 
    const decoder = new StringDecoder('utf8');
    let buffer = '';

    // saving the payload to the buffer as a holder.  This will only be call   if there  
    // is a payload in the request, if not, it will be ignore.  
    req.on('data', function(data) {
        buffer += decoder.write(data)
    })

    // ending the req binding. This will always be call everytime either the request has a 
    // payload or not, and in this case, if no payload, the buffer will always be empty string 
    req.on('end', function(){
        buffer += decoder.end();

        const choosenHandler = typeof(router[trimmedPath]) !== "undefined" ? router[trimmedPath] : handler.notFound

        const data = {
            "trimmedPath":trimmedPath,
            "method" : method,
            "queryStringObj" : queryStringObj,
            "header" : header,
            "payload": helpers.parseJsonToObject(buffer)
        }

        choosenHandler(data, (statusCode, payload) => {
            // set statusCode or use default statusCode of 200
            statusCode = typeof(statusCode) == "number" ? statusCode : 200

            // set payload or use defualt of {} 
            console.log(payload)
            payload = typeof(payload) == "object" ? payload : {}

            // stringnify the object to json 
            const payloadString = JSON.stringify(payload)

            // sending response 
            res.setHeader("Content-Type", "application/json") // set content type to application/json
            res.writeHead(statusCode) // set status code 
            res.end(payloadString) // send payload in json
            console.log("Return response of ", statusCode, payloadString)
        })

        // console.log({choosenHandler})

        // response 
        // console.log({trimmedPath})
        // res.end(console.log(`I am being listen to ${buffer}\n`))
        // console.log(`Request recieve with a payload`, buffer)
    })
}

// router 
const router = {
    ping : handler.ping,
    users : handler.users,
    tokens : handler.tokens,
    checks : handler.checks
}
