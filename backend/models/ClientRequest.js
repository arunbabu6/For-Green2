const mongoose = require('mongoose');


const clientRequestSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true    
    },
    email: {
        type:String,
        required: true        
    },
    description: {
        type:String,
        required: true        
    },
    requestedAmount: {
        type:Number,
        required: true       
    },
})

module.exports = mongoose.model('ClientRequest', clientRequestSchema);
