import jwt from 'jsonwebtoken';

const generateToken = (userId, remember) => {
  // Determine expiration time based on 'remember me' option
  const expiration = remember ? '365d' : '24h';

  // Generate JWT token with user ID and expiration
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: expiration
  });
};

export default generateToken;