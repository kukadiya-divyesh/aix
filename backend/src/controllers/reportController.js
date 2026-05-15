import prisma from '../config/prisma.js';

const paginate = (page, limit) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 50;
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

/**
 * @route GET /api/reports/movement
 * Full RFID movement tracking — one row per serial number with full audit trail
 */
export const getMovementReport = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { inbound: { po_no: { contains: search, mode: 'insensitive' } } },
            { inbound: { stock_no: { contains: search, mode: 'insensitive' } } },
            { inbound: { product_description: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.serialNumber.count({ where }),
      prisma.serialNumber.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          inbound: {
            select: {
              po_no: true,
              stock_no: true,
              awb_no: true,
              product_description: true,
              quantity: true,
              no_of_box: true,
              warehouse_location: true,
            },
          },
          grid: { select: { code: true } },
          history: {
            orderBy: { timestamp: 'asc' },
            include: { user: { select: { name: true } } },
          },
          outboundLine: {
            select: { flightNo: true, date: true, sbNo: true },
          },
        },
      }),
    ]);

    const data = items.map((sn) => {
      const auditByStatus = (status) => sn.history.find((h) => h.status === status);
      const gateLog  = auditByStatus('IN_GATE');
      const whLog    = auditByStatus('PLACED');
      const pickLog  = auditByStatus('PICKED');
      const outLog   = auditByStatus('OUT_GATE');

      const gateTime = gateLog?.timestamp;
      const outTime  = outLog?.timestamp;
      let dwellTime  = '—';
      if (gateTime && outTime) {
        const diff = Math.round((new Date(outTime) - new Date(gateTime)) / (1000 * 60 * 60));
        dwellTime = `${diff}h`;
      }

      return {
        id: sn.id,
        rfidSerial: sn.code,
        poNo: sn.inbound?.po_no ?? '—',
        stockNo: sn.inbound?.stock_no ?? '—',
        flightNo: sn.outboundLine?.flightNo ?? '—',
        description: sn.inbound?.product_description ?? '—',
        boxes: sn.inbound?.no_of_box ?? 0,
        totalQty: sn.inbound?.quantity ?? 0,
        location: sn.grid?.code ?? sn.inbound?.warehouse_location ?? '—',
        gateScan:   gateLog ? 'Y' : 'N',
        gatePerson: gateLog?.user?.name ?? '—',
        gateTime,
        whScan:   whLog ? 'Y' : 'N',
        whPerson: whLog?.user?.name ?? '—',
        whTime:   whLog?.timestamp,
        status: sn.status,
        pickupScan:  pickLog ? 'Y' : 'N',
        pickupTime:  pickLog?.timestamp,
        outScan:  outLog ? 'Y' : 'N',
        outTime,
        outVehicle: '—',
        dwellTime,
      };
    });

    res.json({ data, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (err) {
    console.error('MOVEMENT REPORT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route GET /api/reports/expiry
 * Bond/expiry distribution report — POs expiring soonest first
 */
export const getExpiryReport = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {
      bond_expiry_date: { not: null },
      ...(search
        ? {
            OR: [
              { po_no: { contains: search, mode: 'insensitive' } },
              { stock_no: { contains: search, mode: 'insensitive' } },
              { product_description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.inbound.count({ where }),
      prisma.inbound.findMany({
        where,
        skip,
        take,
        orderBy: { bond_expiry_date: 'asc' },
        include: {
          serialNumbers: {
            where: { status: { not: 'OUT_GATE' } },
            select: { id: true },
          },
        },
      }),
    ]);

    const data = items.map((ib) => {
      const expiry = ib.bond_expiry_date;
      const daysLeft = expiry
        ? Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: ib.id,
        poNo: ib.po_no,
        stockNo: ib.stock_no ?? '—',
        description: ib.product_description ?? '—',
        boxesAvailable: ib.serialNumbers.length,
        totalQty: ib.quantity,
        expiryDate: expiry,
        daysLeft,
        location: ib.warehouse_location ?? '—',
      };
    });

    res.json({ data, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (err) {
    console.error('EXPIRY REPORT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route GET /api/reports/exceptions
 * Full exception log — inbound + outbound, resolved + unresolved
 */
export const getExceptionsReport = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = search
      ? {
          OR: [
            { note: { contains: search, mode: 'insensitive' } },
            { inbound: { po_no: { contains: search, mode: 'insensitive' } } },
            { outboundLine: { outbound: { inbound: { po_no: { contains: search, mode: 'insensitive' } } } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.exception.count({ where }),
      prisma.exception.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          resolvedBy: { select: { name: true } },
          inbound: { select: { po_no: true, stock_no: true, product_description: true, warehouse_location: true } },
          outboundLine: {
            include: {
              outbound: {
                include: {
                  inbound: { select: { po_no: true, stock_no: true, product_description: true, warehouse_location: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const data = items.map((ex) => {
      const ib = ex.inbound ?? ex.outboundLine?.outbound?.inbound;
      return {
        id: ex.id,
        poNo: ib?.po_no ?? '—',
        stockNo: ib?.stock_no ?? '—',
        flightNo: ex.outboundLine?.flightNo ?? '—',
        description: ib?.product_description ?? '—',
        location: ib?.warehouse_location ?? '—',
        createdOn: ex.createdAt,
        reportedBy: ex.user?.name ?? '—',
        status: ex.isResolved ? 'RESOLVED' : 'OPEN',
        resolvedAt: ex.resolvedAt,
        resolvedBy: ex.resolvedBy?.name ?? null,
        note: ex.note,
        type: ex.inboundId ? 'Inbound' : 'Outbound',
      };
    });

    res.json({ data, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (err) {
    console.error('EXCEPTIONS REPORT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route GET /api/reports/movements  (dashboard date-range version — kept for compatibility)
 */
export const getMovementsByDate = async (req, res) => {
  try {
    const { shedId, startDate, endDate } = req.query;
    if (!shedId) return res.status(400).json({ message: 'shedId is required' });

    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);

    const inbounds = await prisma.inbound.findMany({
      where: { serialNumbers: { some: { shedId: parseInt(shedId) } }, createdAt: { gte: start, lte: end } },
      select: { id: true, po_no: true, awb_no: true, product_description: true, quantity: true, no_of_box: true, status: true, createdAt: true, assignedUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const outbounds = await prisma.outboundLine.findMany({
      where: { outbound: { inbound: { serialNumbers: { some: { shedId: parseInt(shedId) } } } }, date: { gte: start, lte: end } },
      include: { outbound: { include: { inbound: { select: { po_no: true, product_description: true } }, assignedUser: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });

    const inQty  = inbounds.reduce((s, i) => s + (i.quantity || 0), 0);
    const outQty = outbounds.reduce((s, o) => s + (o.quantityIssued || 0), 0);

    res.json({
      summary: { inboundPOs: inbounds.length, inboundQty: inQty, outboundLines: outbounds.length, outboundQty: outQty, netMovement: inQty - outQty, period: { start: startDate, end: endDate } },
      inbounds: inbounds.map(i => ({ ref: i.po_no, awb: i.awb_no, desc: i.product_description, qty: i.quantity, boxes: i.no_of_box, status: i.status, user: i.assignedUser?.name || '—', date: i.createdAt, type: 'INBOUND' })),
      outbounds: outbounds.map(o => ({ ref: o.outbound?.inbound?.po_no, flight: o.flightNo, sbNo: o.sbNo, desc: o.outbound?.inbound?.product_description, qty: o.quantityIssued, boxes: o.noOfBoxes, status: o.status, user: o.outbound?.assignedUser?.name || '—', date: o.date, type: 'OUTBOUND' })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
