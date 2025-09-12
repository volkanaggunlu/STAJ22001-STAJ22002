const logger = require('../logger/logger')
const Review = require('../models/Review')

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const createReview = async (req, res, next) => {
    logger.verbose('Entering createReview')
    try {
        const { name, nameDisplayType, email, rating, title, review, show, displayTime, source } = req.body
        const { slug } = req.params

        const user = req.user

        const reviewData = { productSlug: slug, name, source, displayTime, nameDisplayType, email, rating: (rating < 1 || rating > 5) ? 5 : Math.round(rating), title, review, show: show ?? (user && user.role === 'admin' ? true : false) }
        logger.debug(`Initializing review (not saving): ${JSON.stringify(reviewData)}`)
        const newReview = new Review(reviewData)

        if (req.tempFilename) {
            // the file is saved to `${process.cwd()}/public/${slug}/review/${req.tempFilename}`. rename to `${newReview._id}.webp`
            const dir = `${process.cwd()}/public/product-images/${slug}/review`;
            const oldFilePath = path.join(dir, req.tempFilename);
            const file = fs.readFileSync(oldFilePath);
            const baseName = newReview._id;
            const originalExtension = path.extname(req.tempFilename);
            const newFilePath = path.join(dir, `${baseName}${originalExtension}`);
            const webpFilePath = path.join(dir, `${baseName}.webp`);

            fs.writeFileSync(newFilePath, file);
            logger.verbose(`Review media saved: ${newFilePath}`);

            await sharp(file)
                .toFormat('webp')
                .toFile(webpFilePath);
            logger.verbose(`Review media converted to WebP: ${webpFilePath}`);

            fs.unlinkSync(oldFilePath);

            newReview.media = newReview._id + '.webp';
        }

        await newReview.save();
        res.status(201).send(newReview)
        logger.verbose('Exiting createReview')
    } catch (error) {
        next(error)
    }
}

// gets the average rating, total number of reviews, and total number of reviews with each ranking of a product
// returns an object with the following properties:
// - averageRating: number
// - totalReviews: number
// - ratingCounts: object: { 1: number, 2: number, 3: number, 4: number, 5: number }
const getReviewStats = async (req, res, next) => {
    logger.verbose('Entering getReviewStats')
    try {
        const { slug } = req.params
        const reviews = await Review.find({ productSlug: slug, show: true }).lean()
        const totalReviews = reviews.length
        const averageRating = totalReviews > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews : 5
        const ratingCounts = reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1
            return acc
        }, {})

        logger.debug(`Got review stats for ${slug}: ${JSON.stringify({ averageRating, totalReviews, ratingCounts })}`)
        res.send({ averageRating, totalReviews, ratingCounts })
        logger.verbose('Exiting getReviewStats')
    } catch (error) {
        next(error)
    }
}

const getPagedReviews = async (req, res, next) => {
    logger.verbose('Entering getPagedReviews')
    try {
        let { page, limit, showAll } = req.query
        const slug = req.params.slug

        page = parseInt(page, 10)
        limit = parseInt(limit || 5, 10)
        showAll = showAll === 'true'

        logger.debug(`Getting reviews for ${slug}. Page: ${page}, Limit: ${limit}, ShowAll: ${showAll}`)

        if (isNaN(page) || page < 1) page = 1
        if (isNaN(limit) || limit < 1) limit = 5
        if (limit > 100) limit = 100
        const skip = (page - 1) * limit
        const reviews = await Review.find(showAll ? { productSlug: slug } : { productSlug: slug, show: true }).sort({ displayTime: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await Review.countDocuments(showAll ? { productSlug: slug } : { productSlug: slug, show: true })

        const totalPages = Math.ceil(total / limit)
        if (page > totalPages) {
            logger.warn(`Page ${page} is out of range. Total pages: ${totalPages}`)
            res.send({
                reviews: [],
                meta: { total, page, limit, totalPages },
            })
            logger.verbose('Exiting getPagedReviews')
            return
        }
        logger.verbose(`Got ${reviews.length} ${slug} reviews. Total: ${total}, Page: ${page}, Limit: ${limit}, TotalPages: ${totalPages}`)
        res.send({
            reviews,
            meta: { total, page, limit, totalPages },
        })
        logger.verbose('Exiting getPagedReviews')
        return
    } catch (error) {
        next(error)
    }
}

const updateReview = async (req, res, next) => {
    logger.verbose('Entering updateReview')
    try {
        const { _id } = req.params
        const { show, title, review, name, nameDisplayType, media, rating, email } = req.body
        const newReview = await Review.findByIdAndUpdate(_id, { show, title, review, name, nameDisplayType, media, rating, email }, { new: true })
        if (!newReview) {
            logger.warn(`Review with ID ${_id} not found`)
            return res.status(404).send()
        }
        res.send(newReview)
        logger.verbose('Exiting updateReview')
    } catch (error) {
        next(error)
    }
}

const softDeleteReview = async (req, res, next) => {
    logger.verbose('Entering softDeleteReview')
    try {
        const { _id } = req.params
        const review = await Review.findByIdAndUpdate(_id, { deleted: true }, { new: true })
        if (!review) {
            logger.warn(`Review with ID ${_id} not found`)
            return res.status(404).send()
        }
        res.send(review)
        logger.verbose('Exiting softDeleteReview')
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createReview,
    getPagedReviews,
    updateReview,
    softDeleteReview,
    getReviewStats,
}