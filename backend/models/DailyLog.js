const mongoose = require('mongoose');

const LogItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: [0.1, 'Quantity must be positive'] },
    calories: { type: Number, required: true, min: [0, 'Calories cannot be negative'] },
  },
  { _id: true }
);

const DailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    targetCalories: {
      type: Number,
      required: true,
      default: 2000,
    },
    totalCaloriesConsumed: {
      type: Number,
      default: 0,
      min: [0, 'Total calories cannot be negative'],
    },
    items: [LogItemSchema],
  },
  { timestamps: true }
);

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

DailyLogSchema.set('toJSON', {
  transform(doc, ret) {
    ret.goalMet = ret.totalCaloriesConsumed <= ret.targetCalories;
    ret.goalPercentage = Math.round((ret.totalCaloriesConsumed / ret.targetCalories) * 100);
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);
