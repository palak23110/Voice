const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// Blog listing page
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const category = req.query.category || '';
    
    let query = { published: true };
    if (category) {
      query.category = category;
    }
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    res.render('blog/list', {
      title: 'All Blogs - Voices',
      blogs,
      currentPage: page,
      totalPages,
      category,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.render('blog/list', {
      title: 'All Blogs - Voices',
      blogs: [],
      currentPage: 1,
      totalPages: 1,
      category: '',
      user: req.session.user
    });
  }
});

// Single blog detail page
router.get('/:id', async (req, res) => {
  try {
    // Check if this is the create route
    if (req.params.id === 'create' || req.params.id === 'list') {
      return res.redirect('/blog/' + req.params.id);
    }
    
    // Check if ID is valid MongoDB ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    
    if (!isValidObjectId) {
      return res.status(404).render('error', { 
        error: 'Invalid blog ID format',
        user: req.session.user 
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { 
        error: 'Blog not found',
        user: req.session.user 
      });
    }
    
    // Ensure blog has required fields with defaults
    if (!blog.imageUrl) {
      blog.imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80';
    }
    if (!blog.content) {
      blog.content = 'Content coming soon...';
    }
    if (!blog.excerpt) {
      blog.excerpt = blog.content.substring(0, 150) + '...';
    }
    
    // Increment views
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    
    // Get comments
    const comments = await Comment.find({ blogId: blog._id })
      .sort({ createdAt: -1 })
      .exec();
    
    // Get related blogs
    const relatedBlogs = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      published: true
    })
      .limit(3)
      .exec();
    
    res.render('blog/detail', {
      title: blog.title + ' - Voices',
      blog,
      comments: comments || [],
      relatedBlogs: relatedBlogs || [],
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).render('error', { 
      error: 'Error loading blog. Please try again later.',
      user: req.session.user 
    });
  }
});

// Create blog page (GET)
router.get('/create/new', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.render('blog/create', {
    title: 'Create New Blog - Voices',
    user: req.session.user
  });
});

// Create blog (POST)
router.post('/create', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const { title, content, excerpt, category, tags, imageUrl } = req.body;
    
    const blog = new Blog({
      title,
      content,
      excerpt,
      author: req.session.user.username,
      authorId: req.session.user.id,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      imageUrl: imageUrl || '/images/default-blog.jpg'
    });
    
    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.render('blog/create', {
      title: 'Create New Blog - Voices',
      error: 'Error creating blog',
      user: req.session.user
    });
  }
});

// Edit blog page (GET)
router.get('/edit/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }
    
    // Check if user is the author
    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }
    
    res.render('blog/edit', {
      title: 'Edit Blog - Voices',
      blog,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blog for edit:', error);
    res.status(500).render('error', { error: 'Error loading blog' });
  }
});

// Update blog (POST)
router.post('/edit/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const { title, content, excerpt, category, tags, imageUrl } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }
    
    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }
    
    blog.title = title;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.category = category;
    blog.tags = tags ? tags.split(',').map(t => t.trim()) : [];
    blog.imageUrl = imageUrl || blog.imageUrl;
    blog.updatedAt = Date.now();
    
    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).render('error', { error: 'Error updating blog' });
  }
});

// Delete blog
router.post('/delete/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('error', { error: 'Blog not found' });
    }
    
    if (blog.authorId.toString() !== req.session.user.id) {
      return res.status(403).render('error', { error: 'Unauthorized' });
    }
    
    // Delete associated comments
    await Comment.deleteMany({ blogId: blog._id });
    
    // Delete blog
    await Blog.findByIdAndDelete(req.params.id);
    
    res.redirect('/blog/list');
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).render('error', { error: 'Error deleting blog' });
  }
});

// Add comment
router.post('/:id/comment', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const { content } = req.body;
    const comment = new Comment({
      blogId: req.params.id,
      author: req.session.user.username,
      authorId: req.session.user.id,
      content
    });
    
    await comment.save();
    res.redirect(`/blog/${req.params.id}`);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.redirect(`/blog/${req.params.id}`);
  }
});

module.exports = router;

