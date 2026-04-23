import express from 'express';
import { getShedStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats/:shedId', protect, getShedStats);

export default router;
