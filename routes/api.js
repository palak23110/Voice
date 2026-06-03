const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

// API endpoint for JSON-driven featured content page
router.get('/featured', async (req, res) => {
  try {
    // Always get real blogs from database first
    const blogs = await Blog.find({ published: true })
      .sort({ views: -1 })
      .limit(6)
      .exec();
    
    let featuredData = [];
    
    if (blogs.length > 0) {
      // Use real blog data from database
      featuredData = blogs.map(blog => ({
        id: blog._id.toString(),
        title: blog.title,
        excerpt: blog.excerpt || blog.content?.substring(0, 150) + '...' || 'Read more...',
        author: blog.author,
        category: blog.category,
        views: blog.views || 0,
        imageUrl: blog.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=90',
        createdAt: blog.createdAt,
        tags: blog.tags || []
      }));
    } else {
      // Fallback to JSON if no blogs in database
      const jsonDataPath = path.join(__dirname, '../data/featured-blogs.json');
      try {
        const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
        const jsonBlogs = JSON.parse(jsonData);
        
        // Try to find matching blogs in database by title
        for (const jsonBlog of jsonBlogs) {
          const dbBlog = await Blog.findOne({ 
            title: jsonBlog.title,
            published: true 
          }).exec();
          
          if (dbBlog) {
            featuredData.push({
              id: dbBlog._id.toString(),
              title: dbBlog.title,
              excerpt: dbBlog.excerpt || dbBlog.content?.substring(0, 150) + '...' || jsonBlog.excerpt,
              author: dbBlog.author,
              category: dbBlog.category,
              views: dbBlog.views || 0,
              imageUrl: dbBlog.imageUrl || jsonBlog.imageUrl,
              createdAt: dbBlog.createdAt,
              tags: dbBlog.tags || []
            });
          }
        }
      } catch (error) {
        console.error('Error reading featured blogs JSON:', error);
      }
    }
    
    // Save updated data to JSON file
    if (featuredData.length > 0) {
      const jsonDataPath = path.join(__dirname, '../data/featured-blogs.json');
      fs.writeFileSync(jsonDataPath, JSON.stringify(featuredData, null, 2));
    }
    
    res.json(featuredData);
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({ error: 'Error fetching featured blogs' });
  }
});

// API endpoint for search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const blogs = await Blog.find({
      published: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .limit(10)
      .exec();
    
    res.json(blogs);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// API endpoint for blog statistics
router.get('/stats', async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments({ published: true });
    const totalViews = await Blog.aggregate([
      { $match: { published: true } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    const categoryCounts = await Blog.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalBlogs,
      totalViews: totalViews[0]?.total || 0,
      categoryCounts
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;

