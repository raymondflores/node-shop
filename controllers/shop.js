const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getIndex = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const [totalProducts, products] = await Promise.all([
      Product.find().countDocuments(),
      Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    ]);

    res.render('shop/index', {
      title: 'Shop',
      path: '/',
      products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const [totalProducts, products] = await Promise.all([
      Product.find().countDocuments(),
      Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    ]);

    res.render('shop/product-list', {
      title: 'Products',
      path: '/products',
      products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
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

exports.getCheckout = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId').execPopulate();
    const products = user.cart.items;
    const total = products.reduce((total, product) => {
      return total + product.quantity * product.productId.price;
    }, 0);
    const items = products.map(product => ({
      name: product.productId.title,
      description: product.productId.description,
      amount: product.productId.price * 100,
      currency: 'usd',
      quantity: product.quantity
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
    });

    res.render('shop/checkout', {
      path: '/checkout',
      title: 'Checkout',
      products,
      total,
      sessionId: session.id
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(err);
  }
};

exports.getCheckoutSuccess = async (req, res, next) => {
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
