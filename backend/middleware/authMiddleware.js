import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Convert userId to ObjectId if it's a string
    const userId = typeof decoded.userId === 'string' ? 
      new mongoose.Types.ObjectId(decoded.userId) : 
      decoded.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false,
        message: 'Token expired. Please log in again.' 
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
    });
  }
};

export default authMiddleware; 