const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Home page
router.get('/', async (req, res) => {
  try {
    const featuredBlogs = await Blog.find({ published: true })
      .sort({ views: -1 })
      .limit(3)
      .exec();
    
    const recentBlogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .exec();
    
    res.render('index', {
      title: 'Voices - Home',
      featuredBlogs,
      recentBlogs,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.render('index', {
      title: 'Voices - Home',
      featuredBlogs: [],
      recentBlogs: [],
      user: req.session.user
    });
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About - Voices',
    user: req.session.user
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact - Voices',
    user: req.session.user
  });
});

// Contact form submission
router.post('/contact', (req, res) => {
  // In a real application, you would send an email or save to database
  console.log('Contact form submission:', req.body);
  res.redirect('/contact?success=true');
});

module.exports = router;

