import express from 'express';
import { getShedStats, getUserTaskCounts, getUserInboundTasks, getUserOutboundTasks } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats/:shedId', protect, getShedStats);
router.get('/user-tasks', protect, getUserTaskCounts);
router.get('/tasks/inbound', protect, getUserInboundTasks);
router.get('/tasks/outbound', protect, getUserOutboundTasks);

export default router;

