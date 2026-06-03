const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const passport = require('passport');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
console.log("Mongo URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'voices-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize Passport (after session)
app.use(passport.initialize());
app.use(passport.session());

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const apiRoutes = require('./routes/api');
const featuredRoutes = require('./routes/featured');
const profileRoutes = require('./routes/profile');

app.use('/', indexRoutes);
app.use('/blog', blogRoutes);
app.use('/auth', authRoutes);
app.use('/category', categoryRoutes);
app.use('/api', apiRoutes);
app.use('/featured', featuredRoutes);
app.use('/profile', profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { error: 'Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

