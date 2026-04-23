import prisma from '../config/prisma.js';

/**
 * @desc    Get Detailed Stats for a specific Shed
 * @route   GET /api/dashboard/stats/:shedId
 */
export const getShedStats = async (req, res) => {
  try {
    const { shedId } = req.params;
    const sId = parseInt(shedId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Inbound/Outbound Today
    const inboundToday = await prisma.serialNumber.count({
      where: { 
        shedId: sId,
        createdAt: { gte: today }
      }
    });

    const outboundToday = await prisma.outboundLine.count({
      where: {
        outbound: { inbound: { serialNumbers: { some: { shedId: sId } } } },
        date: { gte: today }
      }
    });

    // 2. Capacity
    const totalGrids = await prisma.grid.count({ where: { shedId: sId } });
    const occupiedGrids = await prisma.grid.count({
      where: { 
        shedId: sId,
        serialNumbers: { some: {} } // Has at least one serial number
      }
    });
    const capacityPercent = totalGrids > 0 ? (occupiedGrids / totalGrids) * 100 : 0;

    // 3. Top Customers (Aggregated by Inbound PO or Outbound)
    // We'll use Inbound for now as "Owners" of the stock
    const customers = await prisma.inbound.groupBy({
      by: ['awb_no'], // Using AWB or another field as a proxy for customer if not explicit
      _sum: { no_of_box: true },
      where: { serialNumbers: { some: { shedId: sId } } },
      orderBy: { _sum: { no_of_box: 'desc' } },
      take: 5
    });

    // 4. Latest Exceptions
    const exceptions = await prisma.exception.findMany({
      where: { inbound: { serialNumbers: { some: { shedId: sId } } } },
      include: { user: { select: { name: true } }, inbound: { select: { po_no: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      inboundToday,
      outboundToday,
      totalGrids,
      occupiedGrids,
      capacityPercent: capacityPercent.toFixed(2),
      topCustomers: customers.map(c => ({ name: c.awb_no || 'Unknown', volume: c._sum.no_of_box || 0 })),
      exceptions: exceptions.map(e => ({
        id: e.id,
        receipt: e.inbound.po_no,
        reason: e.note,
        action: 'View',
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error('DASHBOARD STATS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
