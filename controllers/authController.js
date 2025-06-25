const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport'); // Passport is needed for Google Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const validator = require('validator');
require('dotenv').config();

// --- JWT Helper ---
const generateToken = (user) => {
  // Ensure user object is plain if it comes from a model that might have methods
  const payloadUser = { id: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos };
  return jwt.sign(
    { id: user.id, email: user.email }, // Payload for JWT should be minimal
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// --- Regular Registration ---
exports.register = async (req, res, next) => {
  const { email, password, nombre } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required.');
  }
  if (!password || !validator.isLength(password, { min: 6 })) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (!nombre || validator.isEmpty(nombre.trim())) {
    errors.push('Name (nombre) is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  try {
    // User.create handles duplicate email checks and throws an error if email exists
    const initialCredits = parseInt(process.env.DEFAULT_USER_CREDITS || '100', 10);
    const user = await User.create({ email, password, nombre, creditos: initialCredits });

    // User object from User.create is already sanitized (no password_hash) by User.findById
    const token = generateToken(user);
    // User.findById (called by User.create) already excludes password_hash
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos }
    });
  } catch (error) {
    if (error.message === 'Email already exists.') {
      return res.status(400).json({ success: false, message: error.message });
    }
    // Pass other errors to the global error handler
    next(error);
  }
};

// --- Regular Login ---
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required.');
  }
  if (!password || validator.isEmpty(password)) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  try {
    const user = await User.findForAuth(email); // Fetches user with password_hash
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos }
    });
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
};

// --- Google OAuth Configuration & Routes ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback', // Ensure this matches your Google Cloud Console setup
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email || !validator.isEmail(email)) {
          return done(new Error('Valid email not found from Google profile.'), null);
        }

        let user = await User.findForAuth(email); // Check if user exists
        if (!user) {
          const nombre = profile.displayName || (profile.name ? `${profile.name.givenName} ${profile.name.familyName}`.trim() : 'Google User');
          const initialCredits = parseInt(process.env.DEFAULT_USER_CREDITS || '100', 10);
          // Create a random password as Google handles auth; it will be hashed by User.create
          const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
          user = await User.create({
            email,
            password: randomPassword,
            nombre,
            creditos: initialCredits
          });
        }
        // 'user' from User.create or User.findForAuth (if it included all fields) is fine
        // User.findById used by User.create already cleans password_hash
        return done(null, user);
      } catch (error) {
        return done(error, null); // Pass error to passport error handling
      }
    }
  ));

  exports.googleAuth = (req, res, next) => {
    passport.authenticate('google', { session: false, scope: ['profile', 'email'] })(req, res, next);
  };

  exports.googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/api/auth/google/failure', // Redirect for browser flow, though API might just return error
      failWithError: true // Important for API: makes authenticate call next(err) on failure
    }, (err, user, info) => {
      if (err) {
        // This error comes from failWithError or strategy's done(err)
        return res.status(401).json({ success: false, message: err.message || 'Google authentication failed.' });
      }
      if (!user) {
        // This case might be hit if 'done(null, false)' is called, or other auth failures
        return res.status(401).json({ success: false, message: (info && info.message) ? info.message : 'Google authentication failed. User not processed.' });
      }

      // User object here is the one from the strategy's done(null, user)
      // It should be sanitized (no password_hash) if User.create/findById was used correctly
      const token = generateToken(user);
      res.status(200).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, nombre: user.nombre, creditos: user.creditos }
      });
    })(req, res, next);
  };

  exports.googleAuthFailure = (req, res) => { // Fallback route for explicit failure
    res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
  };

} else {
  console.warn("Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) not found in .env. Google login will not be available.");
  // Define dummy handlers if Google Auth is not configured to prevent route errors if called
  exports.googleAuth = (req, res) => res.status(501).json({ success: false, message: "Google OAuth is not configured on the server." });
  exports.googleAuthCallback = (req, res) => res.status(501).json({ success: false, message: "Google OAuth is not configured on the server." });
  exports.googleAuthFailure = (req, res) => res.status(501).json({ success: false, message: "Google OAuth is not configured on the server." });
}

// Passport serialization/deserialization (less critical for session: false, but harmless)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // User.findById excludes password_hash
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
