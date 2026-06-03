const Category = require('../models/Category');

async function loadCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.locals.categories = categories;
    res.locals.navCategories = categories.slice(0, 8);
  } catch (err) {
    console.error('Error loading categories:', err);
    res.locals.categories = [];
    res.locals.navCategories = [];
  }
  next();
}

module.exports = loadCategories;
