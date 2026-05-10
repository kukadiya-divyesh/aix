import express from 'express';
import { getMovementReport, getExpiryReport, getExceptionReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All reports are protected and restricted to Admin/Global
router.get('/movement', protect, getMovementReport);
router.get('/expiry', protect, getExpiryReport);
router.get('/exceptions', protect, getExceptionReport);

export default router;
