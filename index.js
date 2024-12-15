import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import userRoutes from './router/useRouter.js';
import dbConnection from './database/db.js'
import cors from 'cors';
import axios from 'axios';
import './auth.js'; // Import passport strategy configuration
dotenv.config();

const app = express();

// Connect to the database
dbConnection();

app.use(express.json());
const corsOption={
    origin:"https://oauthlogin-front.netlify.app",
    credentials: true
}
//cros connection
app.use(cors(corsOption));
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
// app.get('/auth/github/callback',
//   passport.authenticate('github', { failureRedirect: '/' }),
//   (req, res) => {
//     console.log(req.user); // Debugging
//     const userProfile = req.user.profile; 
//     const accessToken = req.user.accessToken;

//     if (!userProfile || !accessToken) {
//       console.error('User data or token missing from req.user');
//     }

//     res.redirect(
//       `https://oauthlogin-front.netlify.app/dashboard?user=${encodeURIComponent(
//         JSON.stringify(userProfile)
//       )}&token=${encodeURIComponent(accessToken)}`
//     );
//   }
// );

app.post('/auth/github/callback', (req, res) => {
  const { code } = req.body;
  
  // Your logic to exchange the code for an access token
  axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code,
  })
    .then((response) => {
      // GitHub returns the token in the response
      const accessToken = response.data.access_token;
      
      // Use the token to get user info
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then((userResponse) => {
          // Send the user data and token back to the frontend
          res.json({ user: userResponse.data, token: accessToken });
        })
        .catch((error) => {
          console.error("Error fetching user info from GitHub", error);
          res.status(500).send("Failed to fetch user data");
        });
    })
    .catch((error) => {
      console.error("Error exchanging GitHub code", error);
      res.status(500).send("Failed to exchange code");
    });
});


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
