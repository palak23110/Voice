const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const { buildProfileViewData } = require('../utils/profileHelper');

const ensureAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Existing profile route — optional ?u=username to view another writer (same profile/index view)
router.get('/', async (req, res, next) => {
  try {
    const usernameParam = req.query.u;
    const tab = req.query.tab || 'popular';

    if (usernameParam) {
      const profileUser = await User.findOne({
        username: new RegExp(`^${usernameParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      }).lean();

      if (!profileUser) {
        return res.status(404).render('error', {
          error: 'User not found',
          user: req.session.user
        });
      }

      if (req.session.user && req.session.user.id === profileUser._id.toString()) {
        const tabQuery = tab && tab !== 'popular' ? `?tab=${tab}` : '';
        return res.redirect(`/profile${tabQuery}`);
      }

      const viewData = await buildProfileViewData(profileUser._id, tab);
      if (!viewData) {
        return res.status(404).render('error', {
          error: 'User not found',
          user: req.session.user
        });
      }

      return res.render('profile/index', {
        title: `${profileUser.username} - Voices`,
        user: req.session.user,
        ...viewData
      });
    }

    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const viewData = await buildProfileViewData(req.session.user.id, tab);
    if (!viewData) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    res.render('profile/index', {
      title: 'Profile - Voices',
      user: req.session.user,
      ...viewData
    });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', ensureAuthenticated, async (req, res, next) => {
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

router.post('/settings', ensureAuthenticated, async (req, res, next) => {
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

router.get('/help', ensureAuthenticated, async (req, res, next) => {
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
