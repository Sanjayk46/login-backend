import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import useRoute from "./router/useRouter.js";
import axios from "axios";
import "./auth.js"; // Passport GitHub strategy configuration
import dbConnection from "./database/db.js"; // Connect to DB
import User from "./model/useModel.js"; // Mongoose User Model

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://oauthlogin-front.netlify.app",  // Update with your hosted frontend URL
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Helper to generate session data
const generateSessionToken = (user, req) => {
  req.session.user = {
    id: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
};

// GitHub Login Route
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

// GitHub Callback Route
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Generate a session token
    generateSessionToken(req.user, req);
    // Redirect to your hosted frontend after successful authentication
    res.redirect("https://oauthlogin-front.netlify.app/auth/github/callback");
  }
);

// GitHub Callback POST Route
app.post("/auth/github/callback", async (req, res) => {
  const { code } = req.body;
  console.log(code);
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }
  console.log("Request body:", {
    client_id: process.env.GIT_CLIENT_ID,
    client_secret: process.env.GIT_SECRET,
    code,
  });
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GIT_CLIENT_ID,
        client_secret: process.env.GIT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log("Token response:", tokenResponse.data); // Log token response for debugging

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(401).json({ error: "Failed to obtain access token" });
    }

    // Fetch user data from GitHub API
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { id: githubId, login: username, avatar_url: avatarUrl } = userResponse.data;

    // Check if user exists in the database
    let user = await User.findOne({ githubId });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await User.create({
        githubId,
        username,
        avatarUrl,
      });
    }

    // Generate session token (optional)
    // generateSessionToken(user, req);

    res.status(200).json({ message: "Authenticated successfully" });
  } catch (error) {
    console.error("GitHub authentication failed:", error.message);
    res.status(500).json({ error: "GitHub authentication failed" });
  }
});

// Fetch User Data Endpoint
app.get("/user/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(req.session.user);
});

// Start Server
const port = process.env.PORT || 8001;
dbConnection(); // Connect to DB
app.use('/user', useRoute);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
