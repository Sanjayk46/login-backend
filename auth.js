// auth.js
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';
import dotenv from 'dotenv';
import User from './model/useModel.js'; // Assuming you have a User model

dotenv.config();

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});


// Set up the GitHub strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GIT_CLIENT_ID,
    clientSecret: process.env.GIT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
  },
  async (token, tokenSecret, profile, done) => {
    try {
      // Check if the user exists in the database
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        // If user doesn't exist, create a new user
        user = new User({
          githubId: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.photos[0].value,
        });
        await user.save();
      }

      // Return the user object
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));
