import express from 'express';
import { 
  createInbound, 
  getInbounds, 
  getInboundById, 
  updateInbound,
  generateTags,
  getMovements
} from '../controllers/inboundController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', createInbound);
router.get('/', getInbounds);
router.get('/:id', getInboundById);
router.put('/:id', updateInbound);
router.post('/:id/generate-tags', generateTags);
router.get('/:id/movements', getMovements);

export default router;
