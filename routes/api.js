const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const BlogView = require('../models/BlogView');
const User = require('../models/User');
const { getProfileImage } = require('../utils/blogHelper');
const fs = require('fs');
const path = require('path');

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

router.get('/blog/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    for (const c of comments) {
      if (!c.authorImage && c.authorId) {
        const u = await User.findById(c.authorId).lean();
        c.authorImage = getProfileImage(u);
      }
    }

    res.json({
      count: comments.length,
      comments: comments.map((c) => ({
        _id: c._id,
        author: c.author,
        authorId: c.authorId,
        authorImage: c.authorImage || '',
        content: c.content,
        createdAt: c.createdAt,
        profileUrl: c.author ? `/profile?u=${encodeURIComponent(c.author)}` : '#'
      }))
    });
  } catch (error) {
    console.error('Comments API error:', error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

router.get('/blog/:id/viewers', async (req, res) => {
  try {
    const views = await BlogView.find({ blogId: req.params.id })
      .sort({ viewedAt: -1 })
      .populate('userId', 'username avatarUrl profileImage')
      .lean();

    const viewers = views.map((view) => {
      const user = view.userId;
      return {
        userId: user?._id?.toString() || view.userId?.toString(),
        username: user?.username || 'Unknown',
        profileImage: getProfileImage(user),
        viewedAt: view.viewedAt,
        profileUrl: user?.username ? `/profile?u=${encodeURIComponent(user.username)}` : '#'
      };
    });

    res.json({ count: viewers.length, viewers });
  } catch (error) {
    console.error('Viewers API error:', error);
    res.status(500).json({ error: 'Error fetching viewers' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ views: -1 })
      .limit(6)
      .exec();

    let featuredData = [];

    if (blogs.length > 0) {
      featuredData = blogs.map((blog) => ({
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
      const jsonDataPath = path.join(__dirname, '../data/featured-blogs.json');
      try {
        const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
        const jsonBlogs = JSON.parse(jsonData);

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

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const categoryMatches = await Category.find({
      name: { $regex: query, $options: 'i' }
    }).limit(5).lean();

    const blogs = await Blog.find({
      published: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .limit(10)
      .exec();

    res.json({ blogs, categories: categoryMatches });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

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
