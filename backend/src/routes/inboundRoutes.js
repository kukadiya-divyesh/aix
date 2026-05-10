import express from 'express';
import { 
  createInbound, 
  getInbounds, 
  getInboundById, 
  updateInbound,
  generateTags,
  getMovements,
  reportException,
  getExceptionsByInbound,
  getAllExceptions,
  resolveException
} from '../controllers/inboundController.js';
import { protect, requireWriteAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', requireWriteAccess, createInbound);
router.get('/', getInbounds);
router.get('/all/exceptions', getAllExceptions);
router.get('/:id', getInboundById);
router.put('/:id', requireWriteAccess, updateInbound);
router.post('/:id/generate-tags', requireWriteAccess, generateTags);
router.get('/:id/movements', getMovements);
router.post('/:id/exceptions', reportException);
router.get('/:id/exceptions', getExceptionsByInbound);
router.put('/exceptions/:id/resolve', requireWriteAccess, resolveException);

export default router;
