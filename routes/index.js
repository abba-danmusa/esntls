const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController.js')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')
const { catchErrors } = require('../handlers/errorHandlers')
const multer = require('multer');
// Do work here
router.get('/', catchErrors(storeController.getStores))
router.get('/stores', catchErrors(storeController.getStores))
router.get('/add', storeController.addStore)

router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore))

router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore))

router.get('/store/:id/edit', catchErrors(storeController.editStore))

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug))

router.get('/tags', catchErrors(storeController.getStoresByTag))

router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))

router.get('/login', userController.loginForm)

router.post('/login', authController.login)

router.get('/register',
    userController.validateRegister,
    userController.registerForm)

router.post('/register',
    userController.validateRegister,
    catchErrors(userController.register),
    authController.login)

router.get('/logout', authController.logout)

router.get('/account',
    userController.account)

router.post('/account', userController.updateAccount)

router.post('/account/forgot', catchErrors(authController.forgot))

router.get('/account/passwordreset/:token',
    catchErrors(authController.resetPassword))

router.post('/account/passwordreset/:token',
    authController.confirmPasswords,
    catchErrors(authController.updatePassword)
)

router.get('/api/search', catchErrors(storeController.searchStores))

module.exports = router;