const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')
const Jimp = require('jimp')

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/')
        if (isPhoto) {
            next(null, true)
        } else {
            next({ message: 'That file type isn\'t allowed' }, false)
        }
    }
}

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' })
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async(req, res, next) => {
    if (!req.file) {
        next()
        return
    }
    const photo = await jimp.read(req.file.buffer)
    await photo.resize(800, jimp.AUTO)
    const extension = req.file.mimetype.split('/')[1]
    req.body.photo = `${uuid.v4()}.${extension}`
    await photo.write(`./public/uploads/${req.body.photo}`)
        // const extension = req.file.mimetype.split('/')[1]
        // req.body.photo = `${uuid.v4()}.${extension}`
        //     // resize photo
        // const photo = await jimp.read(req.file.buffer)
        // await photo.resize(800, jimp.AUTO)
        // await photo.write(`./public/uploads/${req.body.photo}`)
    next()
}

exports.createStore = async(req, res) => {
    req.body.author = req.user._id
    const store = await (new Store(req.body).save())
    req.flash('success', `You successfully created ${store.slug}`)
    res.redirect(`/store/${store.slug}`)
}

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it')
            // req.flash('error', 'You must own a store to edit it')
    }
}

exports.editStore = async(req, res) => {
    //1 find the store given the id
    const store = await Store.findOne({ _id: req.params.id })
        //2 confirm they are the owner of the store
    confirmOwner(store, req.user)
        //3 render out the edit form so the user can update their store
    res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.getStores = async(req, res) => {
    const stores = await Store.find()
    res.render('stores', { title: 'Stores', stores })
}

exports.updateStore = async(req, res) => {
    req.body.location.type = 'Point'
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec()
    req.flash('success', `Successfully updated ${store.name}`)
    res.redirect(`/store/${store.id}/edit`)
}

exports.getStoreBySlug = async(req, res) => {
    const store = await Store.findOne({ slug: req.params.slug }).populate('author')
    res.render('store', { store, title: store.name })
}

exports.getStoresByTag = async(req, res) => {
    const tag = req.params.tag
    const tagQuery = tag || { $exists: true }
    const tagsPromise = Store.getTagList()
    const storePromise = Store.find({ tags: tagQuery })
    const [tags, stores] = await Promise.all([tagsPromise, storePromise])

    // const tags =  Store.getTagList()
    // const tag = req.params.tag
    res.render('tag', { tags, title: 'Tags', tag, stores })
}

exports.searchStores = async(req, res) => {
    const stores = await Store.
    find({
            $text: {
                $search: req.query.q
            }
        }, {
            score: { $meta: 'textScore' }
        })
        .sort({
            score: { $meta: 'textScore' }
        })
        .limit(5)
    res.json(stores)
}