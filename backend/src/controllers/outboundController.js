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
        status: 'IN_PROCESS',
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
  const { flightNo, sbNo, quantityIssued, noOfBoxes, date, assignedUserId } = req.body;

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
          demandQty: 0, 
          status: 'IN_PROCESS',
          assignedUserId: assignedUserId ? parseInt(assignedUserId) : null
        }
      });
    } else if (assignedUserId) {
      // Update assigned user if changed in popup
      await prisma.outbound.update({
        where: { id: outbound.id },
        data: { assignedUserId: parseInt(assignedUserId) }
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
        noOfBoxes: parseInt(noOfBoxes || 1),
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
/**
 * @desc    Update Outbound status or details
 * @route   PUT /api/outbound/:id
 */
export const updateOutbound = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, customerName, demandQty, assignedUserId } = req.body;

    const updated = await prisma.outbound.update({
      where: { id: parseInt(id) },
      data: {
        status,
        customerName,
        demandQty: demandQty ? parseInt(demandQty) : undefined,
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Report an exception for an outbound line
 * @route   POST /api/outbound/exceptions/:lineId
 */
export const reportOutboundException = async (req, res) => {
  try {
    const { lineId } = req.params;
    const { note, image } = req.body;

    const exception = await prisma.exception.create({
      data: {
        note,
        image,
        outboundLineId: parseInt(lineId),
        userId: req.user.id
      }
    });

    res.status(201).json(exception);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get exceptions for an outbound line
 * @route   GET /api/outbound/exceptions/:lineId
 */
export const getOutboundExceptions = async (req, res) => {
  try {
    const { lineId } = req.params;
    const exceptions = await prisma.exception.findMany({
      where: { outboundLineId: parseInt(lineId) },
      include: { 
        user: { select: { name: true } },
        resolvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all outbound lines (flattened view)
 * @route   GET /api/outbound/lines
 */
export const getOutboundLines = async (req, res) => {
  const { search, page = 1 } = req.query;
  const limit = 50;
  const skip = (parseInt(page) - 1) * limit;

  try {
    let where = {};
    if (search) {
      where = {
        OR: [
          { flightNo: { contains: search, mode: 'insensitive' } },
          { sbNo: { contains: search, mode: 'insensitive' } },
          { outbound: { inbound: { po_no: { contains: search, mode: 'insensitive' } } } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      prisma.outboundLine.findMany({
        where,
        skip,
        take: limit,
        include: {
          outbound: {
            include: {
              inbound: { select: { po_no: true, product_description: true } },
              assignedUser: { select: { name: true } }
            }
          },
          postedBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.outboundLine.count({ where })
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
 * @desc    Generate Indian E-Invoice (Simulation for Manual Control)
 * @route   POST /api/outbound/einvoice/generate/:lineId
 */
export const generateEInvoice = async (req, res) => {
  try {
    const { lineId } = req.params;
    
    // Simulate API call to IRP
    const irn = 'IRN' + Math.random().toString(36).substring(2, 15).toUpperCase() + Math.random().toString(36).substring(2, 15).toUpperCase();
    const ackNo = 'ACK' + Math.floor(1000000000 + Math.random() * 9000000000);
    
    const updated = await prisma.outboundLine.update({
      where: { id: parseInt(lineId) },
      data: {
        irn,
        ackNo,
        ackDate: new Date(),
        einvoiceStatus: 'GENERATED',
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + irn
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Cancel Indian E-Invoice
 * @route   POST /api/outbound/einvoice/cancel/:lineId
 */
export const cancelEInvoice = async (req, res) => {
  try {
    const { lineId } = req.params;
    
    const updated = await prisma.outboundLine.update({
      where: { id: parseInt(lineId) },
      data: {
        einvoiceStatus: 'CANCELLED'
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
