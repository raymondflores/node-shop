const express = require('express');
const { body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/signup', authController.getSignup);
router.post(
  '/signup',
  [
    body('email', 'Please enter a valid email.')
      .isEmail()
      .custom(async value => {
        const user = await User.findOne({ email: value });
        if (user) throw new Error('Email already exists.');
        return true;
      })
      .normalizeEmail(),
    body('password', 'Password must be 5 characters long and alphanumeric.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password)
          throw new Error('Passwords do not match.');
        return true;
      })
  ],
  authController.postSignup
);

router.get('/login', authController.getLogin);
router.post(
  '/login',
  [
    body('email', 'Please enter a valid email.')
      .isEmail()
      .normalizeEmail(),
    body('password', 'Password must be 5 characters long and alphanumeric.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

router.get('/reset-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
