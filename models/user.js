const mongoose = require('mongoose')
const validator = require('validator')
const passportLocalMongoose = require('passport-local-mongoose')
const mongodbErrorHandler = require('mongoose-mongodb-errors')
const Schema = mongoose.Schema

const userShema = new Schema({
    email: {
        type: String,
        trim: true,
        required: 'Please supply an  email address',
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
})

userShema.plugin(passportLocalMongoose, { usernameField: 'email' })
userShema.plugin(mongodbErrorHandler)

module.exports = mongoose.model('User', userShema)