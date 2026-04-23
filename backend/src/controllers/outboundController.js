import prisma from '../config/prisma.js';

/**
 * @desc    Create Outbound from Inbound (Form View)
 * @route   POST /api/outbound/from-inbound/:inboundId
 */
export const createOutboundFromInbound = async (req, res) => {
  const { inboundId } = req.params;
  const { customerName, demandQty, lines } = req.body;

  try {
    const inbound = await prisma.inbound.findUnique({
      where: { id: parseInt(inboundId) }
    });

    if (!inbound) {
      return res.status(404).json({ message: 'Inbound not found' });
    }

    // Validation: requested qty should not exceed available boxes
    if (demandQty > inbound.no_of_box) {
      return res.status(400).json({ message: `Cannot request ${demandQty} boxes. Only ${inbound.no_of_box} available.` });
    }

    const outbound = await prisma.outbound.create({
      data: {
        inboundId: parseInt(inboundId),
        customerName,
        demandQty: parseInt(demandQty),
        status: 'OPEN',
        lines: {
          create: lines.map(line => ({
            flightNo: line.flight_no,
            sbNo: line.sb_no,
            quantityIssued: parseInt(line.quantity_issued),
            balance: parseInt(line.balance),
            postedByUserId: req.user.id, // From authMiddleware
            status: 'pending'
          }))
        }
      },
      include: {
        lines: true
      }
    });

    res.status(201).json(outbound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all outbounds with filters
 * @route   GET /api/outbound
 */
export const getOutbounds = async (req, res) => {
  const { search, page = 1, status } = req.query;
  const limit = 80;
  const skip = (parseInt(page) - 1) * limit;

  try {
    let where = status ? { status } : {};

    if (search) {
      where = {
        ...where,
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { inbound: { po_no: { contains: search, mode: 'insensitive' } } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      prisma.outbound.findMany({
        where,
        skip,
        take: limit,
        include: {
          inbound: {
            select: { po_no: true, product_description: true }
          },
          _count: {
            select: { lines: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.outbound.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * @desc    Add a line to the Inbound Stock Ledger
 * @route   POST /api/outbound/ledger/:inboundId
 */
export const createLedgerEntry = async (req, res) => {
  const { inboundId } = req.params;
  const { flightNo, sbNo, quantityIssued, date } = req.body;

  try {
    const inbound = await prisma.inbound.findUnique({
      where: { id: parseInt(inboundId) },
      include: { 
        outbounds: { 
          include: { lines: { orderBy: { id: 'desc' }, take: 1 } } 
        } 
      }
    });

    if (!inbound) return res.status(404).json({ message: 'Inbound record not found' });

    // 1. Calculate the starting balance for this entry
    let lastBalance = inbound.quantity;
    
    // Check all previous lines for this inbound
    const allLines = await prisma.outboundLine.findMany({
      where: { outbound: { inboundId: parseInt(inboundId) } },
      orderBy: { id: 'desc' },
      take: 1
    });

    if (allLines.length > 0) {
      lastBalance = allLines[0].balance;
    }

    const newBalance = lastBalance - parseInt(quantityIssued);
    if (newBalance < 0) {
      return res.status(400).json({ message: `Insufficient stock. Current balance is ${lastBalance}.` });
    }

    // 2. Find or create the Outbound "Header" for this Inbound
    let outbound = await prisma.outbound.findFirst({
      where: { inboundId: parseInt(inboundId) }
    });

    if (!outbound) {
      outbound = await prisma.outbound.create({
        data: {
          inboundId: parseInt(inboundId),
          customerName: 'STOCK ISSUANCE',
          demandQty: 0, // We'll update this or use it as a placeholder
          status: 'PARTIAL'
        }
      });
    }

    // 3. Create the Ledger Line
    const line = await prisma.outboundLine.create({
      data: {
        outboundId: outbound.id,
        date: date ? new Date(date) : new Date(),
        flightNo,
        sbNo,
        quantityIssued: parseInt(quantityIssued),
        balance: newBalance,
        status: 'PENDING',
        postedByUserId: req.user.id
      }
    });

    res.status(201).json(line);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get ledger for a specific inbound
 */
export const getLedgerByInbound = async (req, res) => {
  try {
    const lines = await prisma.outboundLine.findMany({
      where: { outbound: { inboundId: parseInt(req.params.inboundId) } },
      include: { postedBy: { select: { name: true } } },
      orderBy: { id: 'asc' }
    });
    res.json(lines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Finalize a ledger entry (Scan Complete)
 * @route   PATCH /api/outbound/ledger/finalize/:lineId
 */
export const finalizeLedgerEntry = async (req, res) => {
  try {
    const line = await prisma.outboundLine.update({
      where: { id: parseInt(req.params.lineId) },
      data: { status: 'DISPATCHED' }
    });
    res.json(line);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
