const Cart=require('../models/userCart')

const cartCountMiddleware = async (req, res, next) => {
    try {
        res.locals.cartCount = 0;

        if (req.session && req.session.user) {
            const cart = await Cart.findOne({ userId: req.session.user._id });
            res.locals.cartCount = cart 
                ? cart.items.reduce((total, item) => total + item.quantity, 0) 
                : 0;
        }

        next();
    } catch (error) {
        console.error('Cart Count Middleware Error:', error);
        res.locals.cartCount = 0;
        next();
    }
};

module.exports=cartCountMiddleware;