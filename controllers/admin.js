const { validationResult } = require('express-validator/check');
const fileHelper = require('../util/file');

const Product = require('../models/product');

exports.getAddProduct = (req, res) => {
  res.render('admin/edit-product', {
    title: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const { title, price, description } = req.body;
    const image = req.file;
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).render('admin/edit-product', {
        title: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        errorMessage: errors.array()[0].msg,
        product: { title, price, description },
        validationErrors: errors.array()
      });

    const imageUrl = `/${image.path}`;
    const product = new Product({
      title,
      price,
      description,
      imageUrl,
      userId: req.user
    });
    await product.save();
    res.redirect('/');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const { edit } = req.query;
    if (!edit) return res.redirect('/');

    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) return res.redirect('/');
    res.render('admin/edit-product', {
      title: 'Edit Product',
      path: '/admin/edit-product',
      editing: edit,
      product,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const { productId, title, price, description } = req.body;
    const image = req.file;
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).render('admin/edit-product', {
        title: 'Add Product',
        path: '/admin/add-product',
        editing: true,
        hasError: true,
        errorMessage: errors.array()[0].msg,
        product: { title, price, description, _id: productId },
        validationErrors: errors.array()
      });

    const product = await Product.findById(productId);
    if (product.userId.toString() !== req.user._id.toString())
      return res.redirect('/');

    product.title = title;
    product.price = price;
    product.description = description;
    if (image) {
      fileHelper.deleteFile(product.imageUrl.slice(1));
      product.imageUrl = `/${image.path}`;
    }

    await product.save();
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.render('admin/products', {
      products,
      title: 'Admin Products',
      path: '/admin/products'
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    fileHelper.deleteFile(product.imageUrl.slice(1));
    await Product.deleteOne({ _id: productId, userId: req.user._id });
    res.status(200).json({ message: 'Success!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Deleting product failed.' });
  }
};
