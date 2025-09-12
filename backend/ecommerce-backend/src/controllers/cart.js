const Cart = require('../models/Cart');
const Product = require('../models/Product');

const { ValidationError } = require('../errors/errors.js');

const logger = require('../logger/logger');

const getOrCreateCart = async (req, res, next) => {
    logger.verbose('Entering getOrCreateCart');
    try {
        const { user, session_id, trackCookie } = req;
        let cart;
        if (user && user._id) {
            // Login kullanıcı için aktif cart bul
            cart = await Cart.findOne({ userId: user._id, isActive: true });
        } else if (session_id) {
            // Misafir kullanıcı için session_id ile cart bul
            cart = await Cart.findOne({ sessionId: session_id, isActive: true });
        }
        if (!cart) {
            return res.json({
                success: true,
                data: {
                    cart: {
                        items: [],
                        totalItems: 0,
                        subtotal: 0,
                        totalSavings: 0,
                        isActive: true
                    }
                }
            });
        }
        // populate product details for each item
        cart = await Cart.findById(cart._id).populate({ path: 'items.productId', select: 'name slug brand sku images image' });
        // Map items to include product details
        const itemsWithProduct = cart.items.map(item => ({
            product: item.productId ? {
                id: item.productId._id,
                name: item.productId.name,
                slug: item.productId.slug,
                brand: item.productId.brand,
                sku: item.productId.sku,
                images: Array.isArray(item.productId.images) ? item.productId.images : [],
                image: (Array.isArray(item.productId.images) && item.productId.images[0]) ? item.productId.images[0].url : (item.productId.image || undefined)
            } : undefined,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            addedAt: item.addedAt,
            bundledProducts: item.bundledProducts || []
        }));
        const cartResponse = {
            ...cart.toObject(),
            items: itemsWithProduct
        };
        logger.info(`Returning cart ${cart._id}`);
        res.json({ success: true, data: { cart: cartResponse } });
    } catch (error) {
        next(error);
    }
};

const addToCart = async (req, res, next) => {
    logger.verbose('Entering addToCart');
    try {
        const { user, session_id, trackCookie } = req;
        // Hem tekli ürün hem de toplu ürün ekleme desteği
        let itemsToAdd = [];
        if (Array.isArray(req.body.items)) {
            // Toplu ekleme (merge)
            itemsToAdd = req.body.items;
        } else {
            // Tekli ekleme
            const { productId, quantity, bundledProducts } = req.body;
            itemsToAdd = [{ productId, quantity, bundledProducts }];
        }
        let cart;
        if (user && user._id) {
            cart = await Cart.findOne({ userId: user._id, isActive: true });
            if (!cart) {
                cart = new Cart({ userId: user._id, isActive: true, items: [], trackCookie: trackCookie ?? null });
            }
        } else if (session_id) {
            cart = await Cart.findOne({ sessionId: session_id, isActive: true });
            if (!cart) {
                cart = new Cart({ sessionId: session_id, isActive: true, items: [], trackCookie: trackCookie ?? null });
            }
        } else {
            cart = new Cart({ items: [], isActive: true, trackCookie: trackCookie ?? null });
        }
        // Merge işlemi: her ürün için sepette varsa quantity artır, yoksa ekle
        const getId = v => (typeof v === 'object' && v !== null && v._id ? v._id.toString() : v ? v.toString() : undefined);
        const isSameBundle = (a, b) => {
            if ((!a || a.length === 0) && (!b || b.length === 0)) return true;
            if (!a || !b) return false;
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if ((a[i]._id || a[i]) != (b[i]?._id || b[i])) return false;
            }
            return true;
        };
        for (const item of itemsToAdd) {
            if (!item.productId || !item.quantity) continue;
            const product = await Product.findById(item.productId);
            if (!product) continue;
            const existingProduct = cart.items.find(cartItem =>
                getId(cartItem.productId) === item.productId &&
                isSameBundle(cartItem.bundledProducts, item.bundledProducts)
            );
            if (existingProduct) {
                existingProduct.quantity += item.quantity;
                cart.markModified('items');
            } else {
                cart.items.push({
                    productId: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    originalPrice: product.originalPrice || product.price,
                    bundledProducts: item.bundledProducts || []
                });
            }
        }
        await cart.save();
        // populate product details for each item
        cart = await Cart.findById(cart._id).populate('items.productId');
        const itemsWithProduct = cart.items.map(item => ({
            product: item.productId ? {
                id: item.productId._id,
                name: item.productId.name,
                slug: item.productId.slug,
                brand: item.productId.brand,
                image: item.productId.image, // veya images[0] gibi
                sku: item.productId.sku
            } : undefined,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            addedAt: item.addedAt,
            bundledProducts: item.bundledProducts || []
        }));
        const cartResponse = {
            ...cart.toObject(),
            items: itemsWithProduct
        };
        res.json({ success: true, message: 'Ürün(ler) sepete eklendi', data: { cart: cartResponse } });
        logger.info(`Added product(s) to cart ${cart._id}`);
        return;
    } catch (error) {
        next(error);
    }
}

const removeFromCart = async (req, res, next) => {
    logger.verbose('Entering removeFromCart');
    try {
        // Önce login kullanıcıya göre cart bul
        let cart = null;
        if (req.user && req.user._id) {
            cart = await Cart.findOne({ userId: req.user._id, isActive: true });
        } else if (req.session_id) {
            cart = await Cart.findOne({ sessionId: req.session_id, isActive: true });
        }
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Sepet bulunamadı' });
        }
        const { productId } = req.params;

        // Sadece productId ile eşleşen item'ı sil
        const newItems = cart.items.filter(item => item.productId.toString() !== productId);
        if (newItems.length === cart.items.length) {
            return res.status(400).json({ success: false, message: `Product with ID ${productId} not found in cart` });
        }
        cart.items = newItems;
        await cart.save();
        logger.info(`Removed product with ID ${productId} from cart ${cart._id}`);
        res.json({ success: true, message: 'Ürün sepetten silindi', data: { cart } });
    } catch (error) {
        next(error);
    }
}

// Toplu ürün silme
const removeMultipleFromCart = async (req, res, next) => {
    logger.verbose('Entering removeMultipleFromCart');
    try {
        let cart = null;
        if (req.user && req.user._id) {
            cart = await Cart.findOne({ userId: req.user._id, isActive: true });
        } else if (req.session_id) {
            cart = await Cart.findOne({ sessionId: req.session_id, isActive: true });
        }

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Sepet bulunamadı' });
        }

        const { productIds } = req.body || {};
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Silinecek ürün yok' });
        }

        const idsAsString = productIds.map(id => id?.toString());
        const beforeCount = cart.items.length;
        cart.items = cart.items.filter(item => !idsAsString.includes(item.productId.toString()));

        if (beforeCount === cart.items.length) {
            return res.status(400).json({ success: false, message: 'Belirtilen ürünler sepette bulunamadı' });
        }

        await cart.save();
        logger.info(`Removed ${beforeCount - cart.items.length} products from cart ${cart._id}`);
        return res.json({ success: true, message: 'Ürünler sepetten silindi', data: { cart } });
    } catch (error) {
        return next(error);
    }
}

const updateQuantity = async (req, res, next) => {
    logger.verbose('Entering updateQuantity');
    try {
        // Önce login kullanıcıya göre cart bul
        let cart = null;
        if (req.user && req.user._id) {
            cart = await Cart.findOne({ userId: req.user._id, isActive: true });
        } else if (req.session_id) {
            cart = await Cart.findOne({ sessionId: req.session_id, isActive: true });
        }
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Sepet bulunamadı' });
        }
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new ValidationError(`Invalid quantity: ${quantity}`);
        }

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) {
            throw new ValidationError(`Product with ID ${productId} not found in cart`);
        }

        item.quantity = quantity;
        cart.markModified('items');
        await cart.save();

        logger.info(`Updated the quantity of ${productId} to ${quantity} in cart ${cart._id}`);
        res.json(cart);
    } catch (error) {
        next(error);
    }
}

const clearCart = async (req, res, next) => {
    logger.verbose('Entering clearCart');
    try {
        console.log(req);
        console.log(req.session_id);
        let cart 
        if (req.user && req.user._id) {
            cart = await Cart.findOne({ userId: req.user._id, isActive: true });
        } else if (req.session_id) {
            cart = await Cart.findOne({ sessionId: req.session_id, isActive: true });
        }

        if (!cart) {
            throw new ValidationError(`Cart not found`);
        }

        cart.items = [];
        await cart.save();
        logger.info(`Cleared cart ${cart._id}`);
        res.json(cart);
    } catch (error) {
        next(error)
    }
}

const getCartById = async (req, res, next) => {
    logger.verbose('Entering getCartById');
    try {
        const cart = await Cart.findById(req.params.id)

        
        if (cart) {
            logger.verbose(`Got cart by id ${cart._id}`);
        } else {
            logger.verbose(`No cart found with ${req.params.id}`)
        }
        res.json(cart);
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getOrCreateCart,
    addToCart,
    removeFromCart,
    removeMultipleFromCart,
    updateQuantity,
    clearCart,
    getCartById,
};
