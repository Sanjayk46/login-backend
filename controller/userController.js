import User from '../model/useModel.js'
import bcrypt from 'bcrypt';
import generateToken from '../utils/generateToken.js'

export const register = async (req, res, next) => {
  try {
    const { name, email, password, remember } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      res.statusCode = 409;
      throw new Error('User already exists. Please choose a different email.');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashPassword
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, remember);

    res.status(201).json({
      message: 'Registration successful',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token, // Include token in the response
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal server error",
      error: error.message
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).send({
        message: "Password is incorrect"
      });
    }

    // Generate token
    const token = generateToken(user._id, remember);

    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token, // Include token in the response
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal server error",
      error: error.message
    });
  }
};
