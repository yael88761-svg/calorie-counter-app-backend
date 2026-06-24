const mongoose = require('mongoose');

const logItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    min: 0,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
});

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    targetCalories: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCaloriesConsumed: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: {
      type: [logItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

dailyLogSchema.virtual('goalMet').get(function goalMet() {
  return this.totalCaloriesConsumed <= this.targetCalories;
});

module.exports = mongoose.model('DailyLog', dailyLogSchema);
