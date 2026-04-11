const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/env');

// Simple password hashing (use bcrypt in production)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + config.JWT_SECRET).digest('hex');
};

// Simple JWT-like token generation (use jsonwebtoken in production)
const generateToken = (userId) => {
  const payload = JSON.stringify({ id: userId, iat: Date.now() });
  const signature = crypto
    .createHmac('sha256', config.JWT_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
};

const verifyToken = (token) => {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expectedSig = crypto
      .createHmac('sha256', config.JWT_SECRET)
      .update(payload)
      .digest('hex');
    if (signature !== expectedSig) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const registerUser = async ({ name, email, password, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const hashedPassword = hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  };
};

module.exports = { registerUser, loginUser, verifyToken, generateToken };
