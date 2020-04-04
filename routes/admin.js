const express = require('express');
const router = express.Router();
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/auth');

router.get('/add-product', isAuth, adminController.getAddProduct);
router.post(
  '/add-product',
  isAuth,
  [
    body('title', 'Title must have at least 3 characters')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    // body('imageUrl', 'Image must be a valid URL').isURL(),
    body('price', 'Price must have two decimal places').isFloat(),
    body(
      'description',
      'Description must be min 5 characters and max 200 characters'
    )
      .isLength({ min: 5, max: 200 })
      .trim()
  ],
  adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post(
  '/edit-product',
  isAuth,
  [
    body('title', 'Title must have at least 3 characters')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    // body('imageUrl', 'Image must be a valid URL').isURL(),
    body('price', 'Price must have two decimal places').isFloat(),
    body(
      'description',
      'Description must be min 5 characters and max 200 characters'
    )
      .isLength({ min: 5, max: 200 })
      .trim()
  ],
  adminController.postEditProduct
);

router.post('/delete-product', isAuth, adminController.deleteProduct);

module.exports = router;
