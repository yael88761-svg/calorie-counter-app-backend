const DailyLog = require('../models/DailyLog');
const Product = require('../models/Product');
const User = require('../models/User');

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateLogForDate(userId, date) {
  let log = await DailyLog.findOne({ userId, date });

  if (log) {
    return log;
  }

  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  log = await DailyLog.create({
    userId,
    date,
    targetCalories: user.calorieGoal,
    totalCaloriesConsumed: 0,
    items: [],
  });

  return log;
}

async function getToday(req, res, next) {
  try {
    const date = getTodayDateString();
    const log = await getOrCreateLogForDate(req.user.id, date);

    if (!log) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
}

async function getLogByDate(req, res, next) {
  try {
    const { date } = req.params;
    const log = await DailyLog.findOne({ userId: req.user.id, date });

    if (!log) {
      return res.status(404).json({ message: 'Log not found for this date' });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const logs = await DailyLog.find({ userId: req.user.id }).sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
}

async function addToBasket(req, res, next) {
  try {
    const { productId } = req.body;

    if (!productId) {
      return addManualCalories(req, res, next);
    }

    const { unit, quantity } = req.body;
    const date = getTodayDateString();

    const log = await getOrCreateLogForDate(req.user.id, date);

    if (!log) {
      return res.status(404).json({ message: 'User not found' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const servingSize = product.servingSizes.find(
      (size) => size.unit.toLowerCase() === unit.trim().toLowerCase()
    );

    if (!servingSize) {
      return res.status(400).json({ message: 'Invalid unit for this product' });
    }

    let calories;

    try {
      calories = Product.calculateCalories(
        quantity,
        servingSize.weightInGrams,
        product.caloriesPer100g
      );
    } catch (error) {
      return res.status(400).json({
        message: 'לא ניתן לחשב קלוריות — בדוק את קלוריות ל-100g ומשקל היחידה',
      });
    }

    log.items.push({
      productId: product._id,
      productName: product.name,
      unit: servingSize.unit,
      quantity,
      calories,
    });

    log.totalCaloriesConsumed += calories;
    await log.save();

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

async function addManualCalories(req, res, next) {
  try {
    const calories = Number(req.body.calories);
    const { name } = req.body;
    const date = getTodayDateString();

    if (!Number.isFinite(calories) || calories <= 0) {
      return res.status(400).json({ message: 'Calories must be greater than 0' });
    }

    const log = await getOrCreateLogForDate(req.user.id, date);

    if (!log) {
      return res.status(404).json({ message: 'User not found' });
    }

    const productName = name?.trim() || 'קלוריות ידניות';

    log.items.push({
      productName,
      calories,
    });

    log.totalCaloriesConsumed += calories;
    await log.save();

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

async function removeFromBasket(req, res, next) {
  try {
    const { itemId } = req.params;
    const date = getTodayDateString();

    const log = await DailyLog.findOne({ userId: req.user.id, date });

    if (!log) {
      return res.status(404).json({ message: 'Today\'s log not found' });
    }

    const item = log.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in basket' });
    }

    log.totalCaloriesConsumed -= item.calories;
    item.deleteOne();
    await log.save();

    res.json(log);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getToday,
  getLogByDate,
  getHistory,
  addToBasket,
  addManualCalories,
  removeFromBasket,
  getTodayDateString,
  getOrCreateLogForDate,
};
