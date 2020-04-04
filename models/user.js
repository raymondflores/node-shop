const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});

userSchema.methods.addToCart = async function(product) {
  try {
    const cartItems = [...this.cart.items];
    const cartProductIndex = cartItems.findIndex(
      cp => cp.productId.toString() === product._id.toString()
    );

    if (cartProductIndex > -1) {
      cartItems[cartProductIndex].quantity += 1;
    } else {
      cartItems.push({
        productId: product._id,
        quantity: 1
      });
    }

    this.cart = { items: cartItems };
    await this.save();
  } catch (err) {
    console.log(err);
  }
};

userSchema.methods.removeFromCart = async function(productId) {
  this.cart.items = this.cart.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  return await this.save();
};

userSchema.methods.clearCart = async function() {
  this.cart = { items: [] };
  return await this.save();
};

module.exports = mongoose.model('User', userSchema);
