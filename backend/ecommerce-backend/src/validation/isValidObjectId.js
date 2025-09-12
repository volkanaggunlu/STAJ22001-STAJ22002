const mongoose = require('mongoose');

// validates if the given _id is a valid mongoDB ObjectId
const isValidObjectId = (_id) => {
    return mongoose.Types.ObjectId.isValid(_id);
} 

module.exports = isValidObjectId;