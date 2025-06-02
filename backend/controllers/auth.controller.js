import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendConfirmationEmail, sendPasswordResetEmail } from '../services/emailService.js';

export const signup = async (req, res) => {
  try {
    console.log('Signup request received:', { 
      fullName: req.body.fullName,
      email: req.body.email,
      password: '***'
    });
    
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          fullName: !fullName,
          email: !email,
          password: !password
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ 
        message: 'Invalid email format',
        field: 'email'
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        field: 'password'
      });
    }

    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      console.log('Validation failed: Password does not meet strength requirements');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        field: 'password'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ 
        message: 'Email already registered',
        field: 'email'
      });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      role: role || 'User',
      emailVerificationToken,
      emailVerificationExpires,
      softSkillScore: 0,
      progress: 0,
      userId: Math.floor(100000 + Math.random() * 900000)
    });

    // Validate the user document before saving
    const validationError = user.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(validationError.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    await user.save();
    console.log('User created successfully:', user.email);

    // Send confirmation email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
      await sendConfirmationEmail(email, verificationUrl);
      console.log('Confirmation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the signup if email fails
    }

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email already registered',
        field: 'email'
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generate JWT token
    const authToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Email confirmed successfully',
      token: authToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ message: 'Error confirming email', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'Email and password are required',
        missingFields: {
          email: !email,
          password: !password
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('Login failed: Email not verified');
      return res.status(401).json({ 
        message: 'Please verify your email first',
        email: user.email
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('Login successful for user:', user.email);
    res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        softSkillScore: user.softSkillScore,
        progress: user.progress
      }
    });
  } catch (error) {
    console.error('Login error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    console.log('Forgot password request received:', { email: req.body.email });
    
    const { email } = req.body;

    // Validate email
    if (!email) {
      console.log('Validation failed: Email is required');
      return res.status(400).json({ 
        message: 'Email is required',
        field: 'email'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ 
        message: 'No account found with this email address',
        field: 'email'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Update user with reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const result = await sendPasswordResetEmail(user.email, resetUrl);
      
      console.log('Password reset email result:', result);
      
      // Always return success in development mode
      if (process.env.NODE_ENV === 'development') {
        res.status(200).json({ 
          message: 'Password reset instructions have been sent to your email',
          email: user.email,
          previewUrl: result.previewUrl,
          isTestMode: true
        });
      } else {
        res.status(200).json({ 
          message: 'Password reset instructions have been sent to your email',
          email: user.email
        });
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      // In development mode, still return success
      if (process.env.NODE_ENV === 'development') {
        res.status(200).json({ 
          message: 'Password reset instructions have been sent to your email',
          email: user.email,
          isTestMode: true
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send password reset email. Please try again later.'
        });
      }
    }
  } catch (error) {
    console.error('Forgot password error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      console.log('Validation failed: Password does not meet strength requirements');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        field: 'password'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired password reset link. Please request a new one.' 
      });
    }

    // Update user's password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Error resetting password', 
      error: error.message 
    });
  }
}; 