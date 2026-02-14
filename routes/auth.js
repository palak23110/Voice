const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    title: 'Login - Voices',
    error: null,
    user: null
  });
});

// Login (POST)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', {
        title: 'Login - Voices',
        error: 'Invalid email or password',
        user: null
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login - Voices',
        error: 'Invalid email or password',
        user: null
      });
    }
    
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };
    
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - Voices',
      error: 'An error occurred during login',
      user: null
    });
  }
});

// Signup page
router.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/signup', {
    title: 'Sign Up - Voices',
    error: null,
    user: null
  });
});

// Signup (POST)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.render('auth/signup', {
        title: 'Sign Up - Voices',
        error: 'Passwords do not match',
        user: null
      });
    }
    
    if (password.length < 6) {
      return res.render('auth/signup', {
        title: 'Sign Up - Voices',
        error: 'Password must be at least 6 characters',
        user: null
      });
    }
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('auth/signup', {
        title: 'Sign Up - Voices',
        error: 'Email or username already exists',
        user: null
      });
    }
    
    const user = new User({ username, email, password });
    await user.save();
    
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };
    
    res.redirect('/');
  } catch (error) {
    console.error('Signup error:', error);
    res.render('auth/signup', {
      title: 'Sign Up - Voices',
      error: 'An error occurred during signup',
      user: null
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;

