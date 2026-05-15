import express from 'express';
import {
  getMovementReport,
  getExpiryReport,
  getExceptionsReport,
  getMovementsByDate,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Reports page tabs
router.get('/movement',   protect, getMovementReport);
router.get('/expiry',     protect, getExpiryReport);
router.get('/exceptions', protect, getExceptionsReport);

// Dashboard date-range movement modal
router.get('/movements',  protect, getMovementsByDate);

export default router;
