import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import userRoutes from './router/useRouter.js';
import dbConnection from './database/db.js';
import cors from 'cors';
import axios from 'axios';
import './auth.js'; // Import passport strategy configuration

dotenv.config();

const app = express();

// Connect to the database
dbConnection();

// Middleware
app.use(express.json());

const corsOption = {
  origin: "https://oauthlogin-front.netlify.app",
  credentials: true,
};

// Enable CORS
app.use(cors(corsOption));

// Initialize session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// GitHub Authentication Routes

// GitHub login route
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback route
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    // Extract user profile and token
    const userProfile = {
      id: req.user.githubId,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
    };

    // For simplicity, include user data and token in URL query params
    res.redirect(
      `https://oauthlogin-front.netlify.app/dashboard?user=${encodeURIComponent(
        JSON.stringify(userProfile)
      )}`
    );
  }
);

// Optional: If you plan to handle login with a POST request (GitHub token exchange)
app.post('/auth/github/token', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange the code for an access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user information using the token
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userProfile = userResponse.data;

    res.json({
      user: userProfile,
      token: accessToken,
    });
  } catch (error) {
    console.error('GitHub Token Exchange Error:', error);
    res.status(500).json({ error: 'Failed to exchange token or fetch user data' });
  }
});

// Protected route example
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.send(`Welcome ${req.user.username}`);
});

// API Routes
app.use('/user', userRoutes);

// Set the port and start the server
const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
