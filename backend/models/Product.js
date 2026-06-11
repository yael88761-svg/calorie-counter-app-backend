const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      index: true,
    },
    caloriesPer100g: {
      type: Number,
      required: [true, 'Calories per 100g is required'],
      min: [0, 'Calories cannot be negative'],
    },
    servingSizes: {
      type: Map,
      of: Number,
      required: [true, 'At least one serving size is required'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text' });

ProductSchema.statics.findGlobalAndUserProducts = function (userId, search) {
  const query = {
    $or: [{ createdBy: null }, { createdBy: userId }],
  };
  if (search && search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }
  return this.find(query).limit(20).sort({ name: 1 });
};

ProductSchema.statics.findUserProducts = function (userId) {
  return this.find({ createdBy: userId }).sort({ createdAt: -1 });
};

ProductSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    if (ret.servingSizes instanceof Map) {
      ret.servingSizes = Object.fromEntries(ret.servingSizes);
    }
    return ret;
  },
});

module.exports = mongoose.model('Product', ProductSchema);
