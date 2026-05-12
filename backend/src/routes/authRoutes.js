const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
