import express from 'express';
import { 
  createOutboundFromInbound, 
  getOutbounds, 
  createLedgerEntry, 
  getLedgerByInbound, 
  finalizeLedgerEntry 
} from '../controllers/outboundController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', createOutboundFromInbound);
router.get('/', getOutbounds);
router.post('/ledger/:inboundId', createLedgerEntry);
router.get('/ledger/:inboundId', getLedgerByInbound);
router.patch('/ledger/finalize/:lineId', finalizeLedgerEntry);

export default router;
