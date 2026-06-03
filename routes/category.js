const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { resolveCategoryFromParam } = require('../utils/categoryHelper');
const { attachCommentCounts } = require('../utils/blogHelper');

router.get('/:categoryParam', async (req, res) => {
  try {
    const category = await resolveCategoryFromParam(req.params.categoryParam);

    if (!category) {
      return res.status(404).render('error', {
        error: 'Category not found',
        user: req.session.user
      });
    }

    const categoryName = category.name;

    const blogs = await Blog.find({
      $or: [
        { category: categoryName },
        { categorySlug: category.slug }
      ],
      published: true
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const blogsWithCounts = await attachCommentCounts(blogs);

    const totalPosts = await Blog.countDocuments({
      $or: [
        { category: categoryName },
        { categorySlug: category.slug }
      ],
      published: true
    });

    const allCategoryBlogs = await Blog.find({
      $or: [
        { category: categoryName },
        { categorySlug: category.slug }
      ],
      published: true
    }).select('views tags').lean();

    const totalViews = allCategoryBlogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const allTags = allCategoryBlogs.flatMap((blog) => blog.tags || []);
    const tagCounts = {};
    allTags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    res.render('category/detail', {
      title: `${categoryName} - Voices`,
      categoryName,
      categorySlug: category.slug,
      blogs: blogsWithCounts,
      stats: {
        totalPosts,
        totalViews,
        topTags
      },
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading category:', error);
    res.status(500).render('error', { error: 'Error loading category', user: req.session.user });
  }
});

module.exports = router;
