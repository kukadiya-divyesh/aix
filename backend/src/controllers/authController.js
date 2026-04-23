import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

/**
 * @desc    Login and get JWT
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'aix_secret_key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/auth/users
 */
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
/**
 * @desc    Get all users with their warehouse access (Admin only)
 * @route   GET /api/auth/users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        warehouseAccess: {
          select: { id: true, name: true, city: true }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update user access and role (Admin only)
 * @route   PUT /api/auth/users/:id
 */
export const updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, warehouseIds } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        role,
        warehouseAccess: {
          set: warehouseIds.map(wId => ({ id: parseInt(wId) }))
        }
      },
      include: {
        warehouseAccess: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/auth/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
