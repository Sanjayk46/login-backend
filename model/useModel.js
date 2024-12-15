import mongoose from "mongoose";

// Define the schema for users
const userSchema = new mongoose.Schema(
  {
    // User's name
    name: {
      type: String,
      required: true
    },
    // User's email, must be unique
    email: {
      type: String,
      required: true,
      unique: true
    },
    // User's password (encrypted)
    password: {
      type: String,
      required: true
    },
    // Indicates whether the user is an admin or not
    isAdmin: {
      type: Boolean,
      required: true,
      default: false
    },
    // Reset password functionality
    resetPasswordOtp: { 
      type: Number 
    },
    resetPasswordExpires: { 
      type: Date 
    },
    // Liked movies
    likedMovies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie' // Assuming you have a Movie model
    }],
    // GitHub OAuth data (only if using GitHub login)
    githubId: { 
      type: String, 
      unique: true 
    },
    avatarUrl: { 
      type: String 
    },
    // Email verification flag
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    // Security related fields (optional)
    loginAttempts: {
      type: Number,
      default: 0
    },
    accountLocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps
);

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model
export default User;
