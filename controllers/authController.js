const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const validator = require('validator'); // Added for validation
require('dotenv').config();

// --- JWT Helper ---
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// --- Regular Registration ---
exports.register = async (req, res) => {
  const { email, password, nombre } = req.body;
  const errors = [];

  // Validate email
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required.');
  }
  // Validate password
  if (!password || !validator.isLength(password, { min: 6 })) {
    errors.push('Password must be at least 6 characters long.');
  }
  // Validate nombre
  if (!nombre || validator.isEmpty(nombre.trim())) {
    errors.push('Name (nombre) is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const initialCredits = parseInt(process.env.DEFAULT_USER_CREDITS || '100', 10);
    const user = await User.create({ email, password, nombre, creditos: initialCredits });

    const token = generateToken(user);
    res.status(201).json({ token, userId: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- Regular Login ---
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required.');
  }
  // Validate password
  if (!password || validator.isEmpty(password)) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' }); // More specific
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' }); // More specific
    }

    const token = generateToken(user);
    res.status(200).json({ token, userId: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// --- Google OAuth Configuration ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email || !validator.isEmail(email)) { // Also validate email from Google
          return done(new Error('Valid email not found from Google profile.'), null);
        }

        let user = await User.findByEmail(email);
        if (!user) {
          const nombre = profile.displayName || (profile.name ? `${profile.name.givenName} ${profile.name.familyName}`.trim() : 'Google User');
          const initialCredits = parseInt(process.env.DEFAULT_USER_CREDITS || '100', 10);
          user = await User.create({
            email,
            password: Math.random().toString(36).slice(-20) + Math.random().toString(36).slice(-20),
            nombre,
            creditos: initialCredits
          });
        }
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth strategy error:', error); // Log the error
        return done(error, null);
      }
    }
  ));
} else {
  console.warn("Google OAuth credentials not found in .env. Google login will not be available.");
}

// --- Google OAuth Routes ---
exports.googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: "Google OAuth is not configured on the server." });
  }
  // Ensure passport.authenticate is called correctly as middleware
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })(req, res, next);
};

exports.googleAuthCallback = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: "Google OAuth is not configured on the server." });
  }
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }, (err, user, info) => { // Added failureRedirect
    if (err) {
      console.error('Google auth callback error:', err);
      return res.status(500).json({ message: 'Error during Google authentication.', error: err.message });
    }
    if (!user) {
      // This case might be hit if 'done(null, false)' is called in strategy or due to other reasons
      return res.status(401).json({ message: (info && info.message) ? info.message : 'Google authentication failed. User not processed.' });
    }
    const token = generateToken(user);
    // Instead of redirecting, send token for API consistency
    res.status(200).json({ token, userId: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos });
  })(req, res, next);
};

// Added a failure route for Google OAuth
exports.googleAuthFailure = (req, res) => {
  res.status(401).json({ message: 'Google authentication failed. Please try again or contact support.' });
};


// Passport serialization (not strictly needed for JWT session: false, but good practice if sessions were used)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // User object will be attached to req.user
  } catch (error) {
    done(error, null);
  }
});
