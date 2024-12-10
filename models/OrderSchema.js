const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coupon: {
        code: String,
        discountType: String,
        discountValue: Number,
        
    
    },
    deliveryFee:{
    required:true,
    type:Number,
   },
   deliveryDate: {
    type: Date
},
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['Processing', 'Delivered', 'Shipped', 'Cancelled', 'Returned', 'Return Requested'],
            default: 'Processing'
        },
        returnRequest: {
            reason: {type:String},
            isDamaged: { type: Boolean, default: false },
            status: {
                type: String,
                enum: ['Empty', 'Pending', 'Approved', 'Rejected'],
                default: 'Empty'
            },
            requestDate: Date,
            adminResponse: String
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cashOnDelivery', 'onlinePayment','walletPayment'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Processing'
    },
    razorpayOrderId: {  
        type: String,
    },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    paymentFailureReason:{
        type:String,
    }

}, {
    timestamps: true
});

orderSchema.methods.recalculateTotal = function() {
    this.totalAmount = this.items.reduce((total, item) => {
        return item.status !== 'Cancelled' ? total + (item.price * item.quantity) : total;
    }, 0);
};

orderSchema.methods.isReturnEligible = function() {
    if (this.orderStatus !== 'Delivered') return false;
    
    const referenceDate = this.deliveryDate || this.createdAt;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return new Date(referenceDate) > sevenDaysAgo;
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
