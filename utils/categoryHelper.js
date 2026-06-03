const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  'Technology', 'Politics', 'Lifestyle', 'Art',
  'Science', 'Business', 'Health', 'Education'
];

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCategoryName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findOrCreateCategory(rawName, userId = null) {
  const name = normalizeCategoryName(rawName);
  if (!name) {
    throw new Error('Category name is required');
  }

  const slug = slugify(name);
  let category = await Category.findOne({
    $or: [
      { slug },
      { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }
    ]
  });

  if (!category) {
    try {
      category = await Category.create({
        name,
        slug,
        createdBy: userId || null
      });
    } catch (err) {
      if (err.code === 11000) {
        category = await Category.findOne({ slug });
      } else {
        throw err;
      }
    }
  }

  return category;
}

async function resolveCategoryFromParam(param) {
  if (!param) return null;

  const decoded = decodeURIComponent(param);
  const slug = slugify(decoded);

  let category = await Category.findOne({
    $or: [
      { slug },
      { name: new RegExp(`^${escapeRegex(decoded)}$`, 'i') }
    ]
  });

  if (!category && DEFAULT_CATEGORIES.includes(decoded)) {
    category = await findOrCreateCategory(decoded);
  }

  return category;
}

async function seedDefaultCategories() {
  for (const name of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ slug: slugify(name) });
    if (!existing) {
      await Category.create({ name, slug: slugify(name), createdBy: null });
    }
  }
}

async function syncBlogCategorySlugs() {
  const Blog = require('../models/Blog');
  const blogs = await Blog.find({
    $or: [
      { categorySlug: { $exists: false } },
      { categorySlug: '' },
      { categorySlug: null }
    ]
  });

  for (const blog of blogs) {
    if (!blog.category) continue;
    const cat = await findOrCreateCategory(blog.category);
    blog.categorySlug = cat.slug;
    if (blog.category !== cat.name) {
      blog.category = cat.name;
    }
    await blog.save();
  }
}

module.exports = {
  DEFAULT_CATEGORIES,
  slugify,
  normalizeCategoryName,
  findOrCreateCategory,
  resolveCategoryFromParam,
  seedDefaultCategories,
  syncBlogCategorySlugs
};
