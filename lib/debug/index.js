exports.logAsJSON = (obj) => {
    console.log(JSON.stringify(obj));
};

exports.generateData = require('./dataGenerator').generateData;