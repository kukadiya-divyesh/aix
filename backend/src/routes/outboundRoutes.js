import express from 'express';
import { 
  createOutboundFromInbound, 
  getOutbounds, 
  createLedgerEntry, 
  getLedgerByInbound, 
  finalizeLedgerEntry,
  updateOutbound,
  getOutboundLines,
  reportOutboundException,
  getOutboundExceptions
} from '../controllers/outboundController.js';
import { protect, requireWriteAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/lines', getOutboundLines);
router.post('/exceptions/:lineId', reportOutboundException);
router.get('/exceptions/:lineId', getOutboundExceptions);
router.post('/', requireWriteAccess, createOutboundFromInbound);
router.get('/', getOutbounds);
router.put('/:id', requireWriteAccess, updateOutbound);
router.post('/ledger/:inboundId', requireWriteAccess, createLedgerEntry);
router.get('/ledger/:inboundId', getLedgerByInbound);
router.patch('/ledger/finalize/:lineId', requireWriteAccess, finalizeLedgerEntry);

export default router;

