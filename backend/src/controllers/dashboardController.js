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

    // 1. Inbound/Outbound Today (real PO & line counts)
    const inboundToday = await prisma.inbound.count({
      where: {
        warehouse_location: { not: null },
        serialNumbers: { some: { shedId: sId } },
        createdAt: { gte: today }
      }
    });

    const inboundTodayQty = await prisma.inbound.aggregate({
      _sum: { quantity: true },
      where: {
        serialNumbers: { some: { shedId: sId } },
        createdAt: { gte: today }
      }
    });

    const outboundToday = await prisma.outboundLine.count({
      where: {
        outbound: { inbound: { serialNumbers: { some: { shedId: sId } } } },
        date: { gte: today }
      }
    });

    const outboundTodayQty = await prisma.outboundLine.aggregate({
      _sum: { quantityIssued: true },
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

    // 3. PO-wise Stock (Top 5 by box count)
    const poStock = await prisma.inbound.findMany({
      where: { 
        serialNumbers: { some: { shedId: sId, status: { not: 'OUT_GATE' } } } 
      },
      select: {
        po_no: true,
        no_of_box: true,
        product_description: true
      },
      orderBy: { no_of_box: 'desc' },
      take: 5
    });

    // 4. Latest Unresolved Exceptions (Inbound & Outbound)
    const exceptions = await prisma.exception.findMany({
      where: { 
        isResolved: false,
        OR: [
          { inbound: { serialNumbers: { some: { shedId: sId } } } },
          { outboundLine: { outbound: { inbound: { serialNumbers: { some: { shedId: sId } } } } } }
        ]
      },
      include: { 
        user: { select: { name: true } }, 
        inbound: { select: { po_no: true } },
        outboundLine: { 
          include: { 
            outbound: { 
              include: { 
                inbound: { select: { po_no: true } } 
              } 
            } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 5. Grid Details - fetch ALL boxes per grid (no limit)
    const grids = await prisma.grid.findMany({
      where: { shedId: sId },
      include: {
        serialNumbers: {
          where: { status: { not: 'OUT_GATE' } },
          include: { inbound: { select: { po_no: true, product_description: true, no_of_box: true } } }
        }
      }
    });

    res.json({
      inboundToday,
      inboundTodayQty: inboundTodayQty._sum.quantity || 0,
      outboundToday,
      outboundTodayQty: outboundTodayQty._sum.quantityIssued || 0,
      totalGrids,
      occupiedGrids,
      capacityPercent: capacityPercent.toFixed(2),
      topStock: poStock.map(s => ({ po: s.po_no, desc: s.product_description, boxes: s.no_of_box })),
      exceptions: exceptions.map(e => ({
        id: e.id,
        receipt: e.inbound ? e.inbound.po_no : (e.outboundLine?.outbound?.inbound?.po_no || 'N/A'),
        type: e.inboundId ? 'Inbound' : 'Outbound',
        reason: e.note,
        action: 'View',
        createdAt: e.createdAt
      })),
      gridDetails: grids.map(g => {
        const sns = g.serialNumbers;
        const totalBoxes = sns.length;

        // Group boxes by PO
        const poMap = {};
        for (const sn of sns) {
          const po = sn.inbound?.po_no || 'UNKNOWN';
          const desc = sn.inbound?.product_description || 'Unknown Product';
          if (!poMap[po]) poMap[po] = { po, desc, boxes: 0 };
          poMap[po].boxes++;
        }
        const poBreakdown = Object.values(poMap);

        return {
          id: g.id,
          code: g.code,
          x: g.x,
          y: g.y,
          z: g.z,
          occupied: totalBoxes > 0,
          totalBoxes,
          poCount: poBreakdown.length,
          poBreakdown, // Array of { po, desc, boxes }
          // For 3D viz — take primary PO
          product: poBreakdown.length > 0 ? poBreakdown[0].desc : null,
          po: poBreakdown.length > 0 ? poBreakdown[0].po : null,
        };
      })
    });
  } catch (error) {
    console.error('DASHBOARD STATS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user-specific counts for Inbound/Outbound
 * @route   GET /api/dashboard/user-tasks
 */
export const getUserTaskCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const inboundCount = await prisma.inbound.count({
      where: {
        assignedUserId: userId,
        status: { not: 'DONE' }
      }
    });

    const outboundCount = await prisma.outboundLine.count({
      where: {
        outbound: { assignedUserId: userId },
        status: { not: 'DISPATCHED' }
      }
    });

    res.json({ inboundCount, outboundCount });
  } catch (error) {
    console.error('USER TASK COUNTS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Inbound tasks assigned to user
 * @route   GET /api/dashboard/tasks/inbound
 */
export const getUserInboundTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await prisma.inbound.findMany({
      where: {
        assignedUserId: userId,
        status: { not: 'DONE' }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Outbound tasks assigned to user
 * @route   GET /api/dashboard/tasks/outbound
 */
export const getUserOutboundTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all OutboundLines belonging to Outbounds assigned to this user
    const lines = await prisma.outboundLine.findMany({
      where: {
        outbound: { assignedUserId: userId },
        status: { not: 'DISPATCHED' }
      },
      include: {
        outbound: {
          include: {
            inbound: { select: { po_no: true, inv_no: true, product_description: true } }
          }
        },
        exceptions: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(lines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


