const mongoose = require('mongoose')
const slug = require('slugs')
const { static } = require('express')

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates'
        }],
        address: {
            type: String,
            required: 'You must supply an address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an Author'
    }
})

storeSchema.index({
    name: 'text',
    description: 'text'
})

storeSchema.index({ location: '2dsphere' })

storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next()
        return
    }
    this.slug = slug(this.name)

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
    const storeWithSlug = await this.constructor.find({ slug: slugRegEx })
    if (storeWithSlug.length) {
        this.slug = `${this.slug}-${storeWithSlug.length + 1}`
    }

    next()
})

// storeSchema.pre('save', () => {

// })

storeSchema.statics.getTagList = function() {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ])
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // look up stores and populate their reviews
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        // filter for items that only have 2 or more reviews
        {
            $match: { 'reviews.1': { $exists: true } }
        },
        // add the average review field
        {
            $project: {
                averageRating: { $avg: '$reviews.rating' },
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews'
            }
        },
        // sort it by the new field, highest reviews first
        {
            $sort: { averageRating: -1 }
        },
        // limit to at most ten
        { $limit: 10 }
    ])
}

storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
})

function autopopulate(next) {
    this.populate('reviews')
    next()
}

storeSchema.pre('find', autopopulate)
storeSchema.pre('findOne', autopopulate)

module.exports = mongoose.model('Store', storeSchema)