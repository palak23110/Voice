const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const ensureAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

router.use(ensureAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const profileUser = await User.findById(req.session.user.id).lean();
    if (!profileUser) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    const blogs = await Blog.find({ authorId: req.session.user.id, published: true }).lean();
    const blogIds = blogs.map(blog => blog._id);

    const commentCounts = await Comment.aggregate([
      { $match: { blogId: { $in: blogIds } } },
      { $group: { _id: '$blogId', count: { $sum: 1 } } }
    ]);

    const commentMap = commentCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    blogs.forEach(blog => {
      blog.commentCount = commentMap[blog._id.toString()] || 0;
    });

    const tab = req.query.tab || 'popular';
    let sortedBlogs = [...blogs];

    if (tab === 'recommended') {
      sortedBlogs.sort((a, b) => ((b.likes || 0) + (b.commentCount || 0)) - ((a.likes || 0) + (a.commentCount || 0)));
    } else if (tab === 'newest') {
      sortedBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      sortedBlogs.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const totalBlogs = blogs.length;
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const totalComments = blogs.reduce((sum, blog) => sum + (blog.commentCount || 0), 0);

    res.render('profile/index', {
      title: 'Profile - Voices',
      user: req.session.user,
      profileUser,
      blogs: sortedBlogs,
      tab,
      totalBlogs,
      totalViews,
      totalComments
    });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const profileUser = await User.findById(req.session.user.id).lean();
    if (!profileUser) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    res.render('profile/settings', {
      title: 'Settings - Voices',
      user: req.session.user,
      profileUser,
      error: null,
      success: null
    });
  } catch (error) {
    next(error);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const profileUser = await User.findById(userId);
    if (!profileUser) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    const { username, email, bio, avatarUrl, coverImageUrl, currentPassword, newPassword, confirmPassword } = req.body;

    if (!username || !email) {
      return res.render('profile/settings', {
        title: 'Settings - Voices',
        user: req.session.user,
        profileUser: profileUser.toObject(),
        error: 'Username and email are required.',
        success: null
      });
    }

    const duplicateUser = await User.findOne({
      _id: { $ne: userId },
      $or: [{ username }, { email }]
    });

    if (duplicateUser) {
      return res.render('profile/settings', {
        title: 'Settings - Voices',
        user: req.session.user,
        profileUser: profileUser.toObject(),
        error: 'Username or email already in use.',
        success: null
      });
    }

    profileUser.username = username;
    profileUser.email = email;
    profileUser.bio = bio || '';
    profileUser.avatarUrl = avatarUrl || '';
    profileUser.coverImageUrl = coverImageUrl || '';

    if (newPassword) {
      if (!currentPassword) {
        return res.render('profile/settings', {
          title: 'Settings - Voices',
          user: req.session.user,
          profileUser: profileUser.toObject(),
          error: 'Current password is required to change your password.',
          success: null
        });
      }

      const isMatch = await profileUser.comparePassword(currentPassword);
      if (!isMatch) {
        return res.render('profile/settings', {
          title: 'Settings - Voices',
          user: req.session.user,
          profileUser: profileUser.toObject(),
          error: 'Current password is incorrect.',
          success: null
        });
      }

      if (newPassword !== confirmPassword) {
        return res.render('profile/settings', {
          title: 'Settings - Voices',
          user: req.session.user,
          profileUser: profileUser.toObject(),
          error: 'New passwords do not match.',
          success: null
        });
      }

      if (newPassword.length < 6) {
        return res.render('profile/settings', {
          title: 'Settings - Voices',
          user: req.session.user,
          profileUser: profileUser.toObject(),
          error: 'New password must be at least 6 characters long.',
          success: null
        });
      }

      profileUser.password = newPassword;
    }

    await profileUser.save();

    req.session.user.username = profileUser.username;
    req.session.user.email = profileUser.email;

    res.render('profile/settings', {
      title: 'Settings - Voices',
      user: req.session.user,
      profileUser: profileUser.toObject(),
      error: null,
      success: 'Settings updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/help', async (req, res, next) => {
  try {
    const profileUser = await User.findById(req.session.user.id).lean();
    if (!profileUser) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    res.render('profile/help', {
      title: 'Help - Voices',
      user: req.session.user,
      profileUser
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
