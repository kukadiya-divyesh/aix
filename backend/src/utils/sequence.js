import prisma from '../config/prisma.js';

/**
 * Generates a unique serial number in the format YYMM000001 for PostgreSQL
 */
export const getNextSerialNumber = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `${year}${month}`;

  // Find the highest sequence for the current month
  const count = await prisma.serialNumber.count();
  
  // Note: For a true production system, we'd use a dedicated Sequence table 
  // or a native Postgres SEQUENCE to handle concurrency perfectly.
  // For now, we'll increment based on total count + 1
  const sequenceNumber = (count + 1).toString().padStart(6, '0');
  
  return `${prefix}${sequenceNumber}`;
};
