const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

// Category page with JSON-driven content
router.get('/:categoryName', async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const categories = ['Technology', 'Politics', 'Lifestyle', 'Art', 'Science', 'Business', 'Health', 'Education'];
    
    if (!categories.includes(categoryName)) {
      return res.status(404).render('error', { error: 'Category not found' });
    }
    
    // Load JSON data for category statistics
    const jsonDataPath = path.join(__dirname, '../data/category-stats.json');
    let categoryStats = {};
    
    try {
      const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
      categoryStats = JSON.parse(jsonData);
    } catch (error) {
      // If file doesn't exist, create default stats
      categoryStats = {
        [categoryName]: {
          totalPosts: 0,
          totalViews: 0,
          topTags: []
        }
      };
    }
    
    // Get blogs for this category
    const blogs = await Blog.find({
      category: categoryName,
      published: true
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .exec();
    
    // Update stats from actual data
    const totalViews = blogs.reduce((sum, blog) => sum + blog.views, 0);
    const allTags = blogs.flatMap(blog => blog.tags);
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    
    categoryStats[categoryName] = {
      totalPosts: blogs.length,
      totalViews: totalViews,
      topTags: topTags
    };
    
    // Save updated stats
    fs.writeFileSync(jsonDataPath, JSON.stringify(categoryStats, null, 2));
    
    res.render('category/detail', {
      title: `${categoryName} - Voices`,
      categoryName,
      blogs,
      stats: categoryStats[categoryName],
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading category:', error);
    res.status(500).render('error', { error: 'Error loading category' });
  }
});

module.exports = router;

