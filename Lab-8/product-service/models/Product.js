const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            delete ret._id;
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
            return ret;
        }
    }
});

module.exports = mongoose.model('Product', productSchema);
