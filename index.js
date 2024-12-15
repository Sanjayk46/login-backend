import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import userRoutes from './router/useRouter.js';
import dbConnection from './database/db.js'
import './auth.js'; // Import passport strategy configuration
dotenv.config();

const app = express();


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
    // Redirect to the dashboard or home page after successful login
    res.redirect('/');
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

const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
