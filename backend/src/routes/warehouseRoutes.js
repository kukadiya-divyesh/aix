import express from 'express';
import { 
  createWarehouse, 
  getWarehouses, 
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  addShed,
  updateShed,
  deleteShed,
  addGrid,
  updateGrid,
  deleteGrid,
  getAllSheds,
  getAllGrids
} from '../controllers/warehouseController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWarehouses);
router.get('/all/sheds', protect, getAllSheds);
router.get('/all/grids', protect, getAllGrids);
router.get('/:id', protect, getWarehouseById);
router.post('/', protect, adminOnly, createWarehouse);
router.put('/:id', protect, adminOnly, updateWarehouse);
router.delete('/:id', protect, adminOnly, deleteWarehouse);

// Shed Management
router.post('/:id/sheds', protect, adminOnly, addShed);
router.put('/sheds/:id', protect, adminOnly, updateShed);
router.delete('/sheds/:id', protect, adminOnly, deleteShed);

// Grid Management
router.post('/sheds/:id/grids', protect, adminOnly, addGrid);
router.put('/grids/:id', protect, adminOnly, updateGrid);
router.delete('/grids/:id', protect, adminOnly, deleteGrid);

export default router;
