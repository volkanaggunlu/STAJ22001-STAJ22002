const Product = require('../models/Product');
const logger = require('../logger/logger');

const { ValidationError } = require('../errors/errors')

const addImage = async (req, res, next) => {
    // This function adds a single image to a products image array.
    logger.verbose('Entering addImage');
    try {
        const slug = req.params.slug;
        const filename = `${req.file.filename}`;

        // Update product in database with new image URL
        logger.debug(`adding image ${filename} to product with slug: ${slug}`);
        const product = await Product.findOne(
            { slug: slug },
        )

        if (!product) {
            throw ValidationError(`Product with slug ${slug} not found`);
        }

        // The uploaded file's name matters. It will be used as the alt text for the image.
        // logger.silly(`product: ${JSON.stringify(product)}`);
        product.images = [...product?.images, { filename, url: `app/public/product-images/${slug}/${filename}`, alt: req.file.originalname }];
        product.save();
        logger.info(`Successfully uploaded image ${filename} for product with the slug: ${slug}`);
        res.json(product);
    } catch (error) {
        next(error);
    }
}

const updateImage = async (req, res, next) => {
    logger.verbose('Entering updateImage');
    try {
        const { imageId, slug, rank, isThumbnail } = req.body;
        logger.silly(`imageId: ${imageId}, slug: ${slug}, rank: ${rank}, isThumbnail: ${isThumbnail}`);

        // Update product in database with new image URL
        logger.debug(`updating image ${imageId} for product with slug: ${slug}`);
        const product = await Product.findOne(
            { slug: slug },
        )
        
        if (!product) {
            throw ValidationError(`Product with slug ${slug} not found`);
        }

        product.images = product.images.map(image => {
            if (image._id == imageId) {
                return { ...image, rank: rank ?? image.rank, isThumbnail: isThumbnail ?? image.isThumbnail };
            }
            return image;
        });

        await product.save();
        logger.info(`Successfully uploaded image for product with the slug: ${slug}`);
        res.json(product);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    addImage,
    updateImage,
};