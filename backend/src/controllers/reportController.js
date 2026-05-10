import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * @desc    Get Inventory Movement Tracking Report
 * @route   GET /api/reports/movement
 */
export const getMovementReport = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = search ? {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { inbound: { po_no: { contains: search, mode: 'insensitive' } } },
        { inbound: { stock_no: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const [total, serialNumbers] = await Promise.all([
      prisma.serialNumber.count({ where }),
      prisma.serialNumber.findMany({
        where,
        include: {
          inbound: true,
          shed: true,
          grid: true,
          outboundLine: {
            include: { outbound: true }
          },
          history: { 
            include: { user: { select: { name: true } } },
            orderBy: { timestamp: 'asc' } 
          }
        },
        skip,
        take,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const reportData = serialNumbers.map(sn => {
      const inGate = sn.history.find(h => h.status === 'IN_GATE');
      const placed = sn.history.find(h => h.status === 'PLACED');
      const picked = sn.history.find(h => h.status === 'PICKED');
      const outGate = sn.history.find(h => h.status === 'OUT_GATE');

      let dwellTime = 'N/A';
      if (inGate && outGate) {
        const diff = outGate.timestamp - inGate.timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        dwellTime = `${days}d ${hours}h`;
      }

      return {
        id: sn.id,
        // Column 1: S.No (handled by frontend)
        // Column 2: RFID Serial
        rfidSerial: sn.code,
        // Column 3: PO Number
        poNo: sn.inbound?.po_no,
        // Column 4: Stock Number
        stockNo: sn.inbound?.stock_no,
        // Column 5: Flight No.
        flightNo: sn.outboundLine?.flightNo || 'N/A',
        // Column 5: Product Description
        description: sn.inbound?.product_description,
        // Column 6: Boxes
        boxes: 1,
        // Column 7: Total QTY
        totalQty: sn.inbound?.qty_per_box,
        // Column 8: W/H Location
        location: sn.grid?.code || sn.shed?.name || 'N/A',
        // Column 9: Gate Scan
        gateScan: inGate ? 'Y' : 'N',
        // Column 10: Gate Person
        gatePerson: inGate?.user?.name || 'N/A',
        // Column 11: Gate Time
        gateTime: inGate?.timestamp,
        // Column 12: W/H Scan (Y/N)
        whScan: placed ? 'Y' : 'N',
        // Column 13: W/H Person
        whPerson: placed?.user?.name || 'N/A',
        // Column 14: W/H Time
        whTime: placed?.timestamp,
        // Column 15: Status
        status: sn.status,
        // Column 16: Pickup Scan
        pickupScan: picked ? 'Y' : 'N',
        // Column 17: Pickup Time
        pickupTime: picked?.timestamp,
        // Column 18: Out Scan
        outScan: outGate ? 'Y' : 'N',
        // Column 19: Out Time
        outTime: outGate?.timestamp,
        // Column 20: Out Vehicle
        outVehicle: sn.outboundLine?.outbound?.vehicleNo || 'N/A',
        // Column 21: Dwell Time
        dwellTime
      };
    });

    res.json({
      data: reportData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Expiry Distribution Report
 * @route   GET /api/reports/expiry
 */
export const getExpiryReport = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      bond_expiry_date: { not: null },
      ...(search ? {
        OR: [
          { po_no: { contains: search, mode: 'insensitive' } },
          { stock_no: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [total, inbounds] = await Promise.all([
      prisma.inbound.count({ where }),
      prisma.inbound.findMany({
        where,
        include: {
          _count: {
            select: { serialNumbers: { where: { status: { not: 'OUT_GATE' } } } }
          }
        },
        skip,
        take,
        orderBy: { bond_expiry_date: 'asc' }
      })
    ]);

    const reportData = inbounds.map(ib => ({
      id: ib.id,
      poNo: ib.po_no,
      stockNo: ib.stock_no,
      description: ib.product_description,
      boxesAvailable: ib._count.serialNumbers,
      totalQty: ib.quantity,
      expiryDate: ib.bond_expiry_date,
      location: ib.warehouse_location
    }));

    res.json({
      data: reportData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Exception Report
 * @route   GET /api/reports/exceptions
 */
export const getExceptionReport = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = search ? {
      OR: [
        { note: { contains: search, mode: 'insensitive' } },
        { inbound: { po_no: { contains: search, mode: 'insensitive' } } },
        { outboundLine: { outbound: { inbound: { po_no: { contains: search, mode: 'insensitive' } } } } }
      ]
    } : {};

    const [total, exceptions] = await Promise.all([
      prisma.exception.count({ where }),
      prisma.exception.findMany({
        where,
        include: {
          inbound: true,
          outboundLine: {
            include: {
              outbound: { include: { inbound: true } }
            }
          },
          user: { select: { name: true } },
          resolvedBy: { select: { name: true } }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const reportData = exceptions.map(ex => ({
      id: ex.id,
      poNo: ex.inbound?.po_no || ex.outboundLine?.outbound?.inbound?.po_no || 'N/A',
      stockNo: ex.inbound?.stock_no || 'N/A',
      flightNo: ex.outboundLine?.flightNo || 'N/A',
      createdOn: ex.createdAt,
      description: ex.note,
      location: ex.inbound?.warehouse_location || 'N/A',
      reportedBy: ex.user?.name,
      status: ex.isResolved ? 'RESOLVED' : 'PENDING',
      resolvedAt: ex.resolvedAt,
      resolvedBy: ex.resolvedBy?.name,
      resolvedNote: ex.resolvedNote
    }));

    res.json({
      data: reportData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
