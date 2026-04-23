import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/authRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import inboundRoutes from './routes/inboundRoutes.js';
import outboundRoutes from './routes/outboundRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Database Health Check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'UP', database: 'PostgreSQL/Prisma' });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('AIX Inventory API (PostgreSQL) is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} using PostgreSQL`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});
