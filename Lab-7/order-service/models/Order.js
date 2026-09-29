const mongoose = require('mongoose');

// Order DB stores only IDs + a snapshot of what was validated at order time.
// It never reads the user/product databases directly.
const orderSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true },
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    userName: String,
    productName: String,
    unitPrice: Number,
    totalPrice: Number,
    status: { type: String, default: 'CREATED' }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            delete ret._id;
            delete ret.__v;
            delete ret.updatedAt;
            return ret;
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);
