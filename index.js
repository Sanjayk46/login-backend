import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import userRoutes from './router/useRouter.js';
import dbConnection from './database/db.js'
import './auth.js'; // Import passport strategy configuration
dotenv.config();

const app = express();

// Connect to the database
dbConnection();

app.use(express.json());

// Initialize session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Route for GitHub login
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub callback route
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    // GitHub login was successful, now redirect to the frontend with user data
    const userProfile = req.user.profile;  // Assuming passport is storing user profile in `req.user.profile`
    const accessToken = req.user.accessToken; // Access token if needed for further API requests

    // You can either set up a session or send a JWT token to the frontend for better handling.
    // For now, let's pass user data in the URL params (for simplicity).
    
    // Redirecting to frontend after successful authentication
    res.redirect(`https://oauthlogin-front.netlify.app/dashboard?user=${encodeURIComponent(JSON.stringify(userProfile))}&token=${accessToken}`);
  }
);

// Protect your routes (example)
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.send(`Welcome ${req.user.username}`);
});

// API routes
app.use("/user", userRoutes);

// Set the port and start the server
const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
