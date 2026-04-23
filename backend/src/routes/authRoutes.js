import express from 'express';
import { login, createUser, getUsers, updateUserAccess, deleteUser } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, adminOnly, createUser); 
router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id', protect, adminOnly, updateUserAccess);
router.delete('/users/:id', protect, adminOnly, deleteUser);

export default router;
