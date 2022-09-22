const configurations = {}

configurations.staging = {
    httpPort : 3000,
    httpsPort : 3001,
    envName : "staging",
    hashingSecret : "thisIsASecret",
    maxChecks : 5
}

configurations.production = {
    httpPort : 5000,
    httpsPort : 5001,
    envName : "production",
    hashingSecret : "thisIsASecret",
    maxChecks : 5
}

// checking the NODE_ENV type 
const currentEnvironment = typeof(process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : '';

// checking if the currentEnviroment is defined 
const environmentToExport = (currentEnvironment) ? configurations[currentEnvironment] : configurations.staging;

module.exports = environmentToExport