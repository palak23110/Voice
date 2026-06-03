const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;

    // 1) Check by googleId
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    // 2) If email exists (local account), link googleId
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        if (!user.profileImage) {
          user.profileImage = (profile.photos && profile.photos[0] && profile.photos[0].value) || '';
        }
        await user.save();
        return done(null, user);
      }
    }

    // 3) Create new user
    const displayName = profile.displayName || (email ? email.split('@')[0] : 'user');
    let baseUsername = displayName.replace(/\s+/g, '').toLowerCase();
    if (!baseUsername) baseUsername = 'user' + Date.now();
    let username = baseUsername;
    let i = 0;
    while (await User.findOne({ username })) {
      i += 1;
      username = baseUsername + i;
    }

    const newUser = new User({
      username,
      email: email || '',
      googleId: profile.id,
      profileImage: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
      password: Math.random().toString(36).slice(-8) // random password for schema
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
