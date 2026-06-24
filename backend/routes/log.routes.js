const express = require('express');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const logController = require('../controllers/log.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

const dateValidator = param('date')
  .matches(/^\d{4}-\d{2}-\d{2}$/)
  .withMessage('Date must be in YYYY-MM-DD format');

const addToBasketValidators = [
  body().custom((_, { req }) => {
    const { productId, unit, quantity, calories, name } = req.body;
    const hasProductId = productId != null && String(productId).trim() !== '';
    const hasManualCalories = calories != null && String(calories).trim() !== '';

    if (hasManualCalories && !hasProductId) {
      const parsedCalories = Number(calories);

      if (!Number.isFinite(parsedCalories) || parsedCalories <= 0) {
        throw new Error('Calories must be greater than 0');
      }

      if (name != null && String(name).trim().length > 100) {
        throw new Error('Name must be at most 100 characters');
      }

      req.body.calories = parsedCalories;
      return true;
    }

    if (hasProductId) {
      if (!unit || !String(unit).trim()) {
        throw new Error('Unit is required');
      }

      const parsedQuantity = Number(quantity);

      if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('A valid product id is required');
      }

      return true;
    }

    throw new Error('Provide productId, unit, and quantity, or calories for manual entry');
  }),
];

const addManualValidators = [
  body('calories').isFloat({ gt: 0 }).withMessage('Calories must be greater than 0').toFloat(),
  body('name').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
];

router.use(auth);

router.get('/today', logController.getToday);
router.get('/history', logController.getHistory);
router.post('/add', addToBasketValidators, validate, logController.addToBasket);
router.post('/add-manual', addManualValidators, validate, logController.addManualCalories);
router.delete(
  '/item/:itemId',
  param('itemId').isMongoId().withMessage('Invalid item id'),
  validate,
  logController.removeFromBasket
);
router.get('/:date', dateValidator, validate, logController.getLogByDate);

module.exports = router;
