const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render('shop/product-list', {
      products,
      title: 'All Products',
      path: '/products'
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    res.render('shop/product-detail', {
      product,
      title: product.title,
      path: '/products'
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getIndex = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render('shop/index', {
      products,
      title: 'Shop',
      path: '/'
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId').execPopulate();
    res.render('shop/cart', {
      path: '/cart',
      title: 'Your Cart',
      products: user.cart.items
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.postCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    await req.user.addToCart(product);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.postDeleteCartProduct = async (req, res, next) => {
  try {
    const { productId } = req.body;
    await req.user.removeFromCart(productId);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'user.userId': req.user._id });
    res.render('shop/orders', {
      path: '/orders',
      title: 'Your Orders',
      orders
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId').execPopulate();
    const products = user.cart.items.map(item => ({
      product: { ...item.productId._doc },
      quantity: item.quantity
    }));
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products
    });
    await order.save();
    await req.user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path.join('data', 'invoices', invoiceName);
    let totalPrice = 0;

    const order = await Order.findById(orderId);
    if (!order) throw 'No Order Found.';
    if (order.user.userId.toString() !== req.user._id.toString())
      throw 'Not Authorized.';

    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('--------------------------------');
    order.products.forEach(product => {
      totalPrice += product.quantity * product.product.price;
      pdfDoc
        .fontSize(14)
        .text(
          `${product.product.title} - ${product.quantity} x $${product.product.price}`
        );
    });
    pdfDoc.text('--------------------------------');
    pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);
    pdfDoc.end();
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};
