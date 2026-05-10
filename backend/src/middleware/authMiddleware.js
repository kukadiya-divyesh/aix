import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('DEBUG: Verifying token:', token.substring(0, 20) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aix_secret_key');
      console.log('DEBUG: Decoded ID:', decoded.id);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true,
          warehouseAccess: { select: { id: true } }
        }
      });

      if (!req.user) {
        console.warn('DEBUG: User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'User matching token not found' });
      }

      next();
    } catch (error) {
      console.error('DEBUG: Token verification failed:', error.message);
      return res.status(401).json({ message: 'Authentication failed: Token is invalid or expired' });
    }
  } else {
    console.warn('DEBUG: No Bearer token provided in headers:', req.headers.authorization);
    return res.status(401).json({ message: 'Authentication failed: No Bearer token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const requireWriteAccess = (req, res, next) => {
  if (req.user && req.user.role !== 'GLOBAL') {
    next();
  } else {
    res.status(403).json({ message: 'Read-only access. You do not have write permissions.' });
  }
};
