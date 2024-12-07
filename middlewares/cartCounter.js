const Cart=require('../models/userCart')

const cartCountMiddleware = async (req, res, next) => {
    
    res.locals.cartCount = 0;
  
    try {
      if (req.session && req.session.userId) {
        const cart = await Cart.findOne({ userId: req.session.userId });
        res.locals.cartCount = cart ? cart.items.length : 0;
      }
      next();
    } catch (error) {
      console.error('Cart count middleware error:', error);
      next();
    }
  };
  
  

module.exports=cartCountMiddleware;