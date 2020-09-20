const passport = require('passport')
const mongoose = require('mongoose')
const User = require('../models/user')
const promisify = require('es6-promisify')
const crypto = require('crypto')
const mail = require('../handlers/mail')

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'failed login',
    successRedirect: '/',
    successFlash: 'You\'re now logged in'
})

exports.logout = (req, res) => {
    req.logout()
    req.flash('success', 'You\'re now logged out')
    res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
        return
    }
    req.flash('error', 'Oops\! you must be logged in before you can do that')
    res.redirect('/login')
}

exports.forgot = async(req, res, next) => {
    // 1. see if a user with that email exist
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        req.flash('error', 'A user with that email does not exist')
        res.redirect('/login')
        next()
        return
    }
    // 2. set reset and expiry token on their account
    user.resetPasswordToken = crypto.randomBytes(25).toString('hex')
    user.resetPasswordExpires = Date.now() + 1200000
    await user.save()
        // 3. send the tokens to their email address
    const resetUrl = `http://${req.headers.host}/account/passwordreset/${user.resetPasswordToken}`
    await mail.send({
            user,
            subject: 'Password reset',
            resetUrl,
            filename: 'password-reset'
        })
        // req.flash('success', `You have been emailed a password reset link ${resetUrl}`)
        // 4. redirect them to the login page
    res.redirect('/login')
}

exports.resetPassword = async(req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    })
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired')
        return res.redirect('/login')
    }
    res.render('passwordReset')
}

exports.confirmPasswords = (req, res, next) => {
    if (req.body.password === req.body['confirm-password']) {
        next()
        return
    }
    req.flash('error', 'Passwords doesn\'t match')
    res.redirect('back')
}

exports.updatePassword = async(req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired')
        return res.redirect('/login')
    }

    const setPassword = promisify(user.setPassword, user)
    await setPassword(req.body.password)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    const updatedUser = await user.save()
    await req.login(updatedUser)
    req.flash('success', 'Your password has been reset successfully and you\'re now logged in')
    res.redirect('/')
}