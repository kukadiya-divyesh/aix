import prisma from '../config/prisma.js';
import { getNextSerialNumber } from '../utils/sequence.js';

/**
 * @desc    Receive Inbound from SAP or Manual Form (PostgreSQL/Prisma)
 * @route   POST /api/inbound
 */
export const createInbound = async (req, res) => {
  try {
    const data = req.body;

    // Calculate qty_per_box
    const quantity = parseFloat(data.quantity || 0);
    const no_of_box = parseInt(data.no_of_box || 0);
    const qty_per_box = no_of_box > 0 ? quantity / no_of_box : 0;

    // Create Inbound record
    const inbound = await prisma.inbound.create({
      data: {
        po_no: data.po_no,
        inv_no: data.inv_no,
        be_no: data.be_no,
        igm_no: data.igm_no,
        cth_no: data.cth_no,
        awb_no: data.awb_no,
        total_value: parseFloat(data.total_value),
        duty: parseFloat(data.duty),
        country_of_origin: data.country_of_origin,
        stock_no: data.stock_no,
        product_description: data.product_description,
        quantity: quantity,
        weight: parseFloat(data.weight),
        no_of_box: no_of_box,
        bond_date: data.bond_date ? new Date(data.bond_date) : null,
        bond_expiry_date: data.bond_expiry_date ? new Date(data.bond_expiry_date) : null,
        warehouse_location: data.warehouse_location,
        per_box_weight_kg: parseFloat(data.per_box_weight_kg),
        pkg_details: data.pkg_details,
        qty_per_box: qty_per_box,
        status: 'PENDING',
        logs: {
          create: {
            action: 'Record Created',
            details: `Initial creation by ${req.user.name}`,
            userId: req.user.id
          }
        }
      }
    });

    // Generate Serial Numbers (RFID Tags) for each box
    const serialNumbers = [];
    for (let i = 0; i < no_of_box; i++) {
      const code = await getNextSerialNumber();
      const sn = await prisma.serialNumber.create({
        data: {
          code,
          inboundId: inbound.id,
          status: 'PRINTED',
          history: {
            create: {
              status: 'PRINTED',
              location: 'System Initialization'
            }
          }
        }
      });
      serialNumbers.push(code);
    }

    res.status(201).json({
      success: true,
      message: 'Inbound created in PostgreSQL and RFID tags generated',
      inbound,
      generated_tags: serialNumbers
    });
  } catch (error) {
    console.error('Create Inbound Error:', error);
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'PO Number already exists in the system.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all inbounds
 * @route   GET /api/inbound
 */
export const getInbounds = async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 80;
    const skip = (parseInt(page) - 1) * limit;

    let where = req.user.role === 'ADMIN' ? {} : {
      warehouse_location: { in: req.user.warehouseAccess.map(w => w.name) }
    };

    if (search) {
      where = {
        AND: [
          where,
          {
            OR: [
              { po_no: { contains: search, mode: 'insensitive' } },
              { awb_no: { contains: search, mode: 'insensitive' } },
              { product_description: { contains: search, mode: 'insensitive' } },
              { stock_no: { contains: search, mode: 'insensitive' } }
            ]
          }
        ]
      };
    }

    const [data, total] = await Promise.all([
      prisma.inbound.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { serialNumbers: true }
          }
        }
      }),
      prisma.inbound.count({ where })
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
 * @desc    Get single inbound by ID with logs
 * @route   GET /api/inbound/:id
 */
export const getInboundById = async (req, res) => {
  try {
    const inbound = await prisma.inbound.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        logs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { serialNumbers: true }
        }
      }
    });
    if (!inbound) return res.status(404).json({ message: 'Record not found' });
    res.json(inbound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update Inbound Record with Audit Log
 * @route   PUT /api/inbound/:id
 */
export const updateInbound = async (req, res) => {
  try {
    const { id } = req.params;
    const rawData = req.body;

    // Track what changed for the log
    const oldRecord = await prisma.inbound.findUnique({ where: { id: parseInt(id) } });
    if (!oldRecord) return res.status(404).json({ message: 'Record not found' });

    // Sanitize and Parse Types
    const quantity = parseFloat(rawData.quantity || oldRecord.quantity);
    const no_of_box = parseInt(rawData.no_of_box || oldRecord.no_of_box);
    const qty_per_box = no_of_box > 0 ? quantity / no_of_box : 0;

    const data = {
      po_no: rawData.po_no,
      inv_no: rawData.inv_no,
      be_no: rawData.be_no,
      igm_no: rawData.igm_no,
      cth_no: rawData.cth_no,
      awb_no: rawData.awb_no,
      total_value: parseFloat(rawData.total_value || 0),
      duty: parseFloat(rawData.duty || 0),
      country_of_origin: rawData.country_of_origin,
      stock_no: rawData.stock_no,
      product_description: rawData.product_description,
      quantity,
      no_of_box,
      qty_per_box,
      weight: parseFloat(rawData.weight || 0),
      per_box_weight_kg: parseFloat(rawData.per_box_weight_kg || 0),
      warehouse_location: rawData.warehouse_location,
      pkg_details: rawData.pkg_details,
      bond_date: rawData.bond_date ? new Date(rawData.bond_date) : null,
      bond_expiry_date: rawData.bond_expiry_date ? new Date(rawData.bond_expiry_date) : null,
    };

    const changes = [];
    Object.keys(data).forEach(key => {
      // Compare primitives for the log
      let newVal = data[key];
      let oldVal = oldRecord[key];
      
      // Handle date comparison
      if (newVal instanceof Date) newVal = newVal.toISOString().split('T')[0];
      if (oldVal instanceof Date) oldVal = oldVal.toISOString().split('T')[0];

      if (newVal != oldVal) {
        changes.push(`${key}: ${oldVal} -> ${newVal}`);
      }
    });

    const updated = await prisma.inbound.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        logs: {
          create: {
            action: 'Record Updated',
            details: changes.join(' | ') || 'No major fields changed',
            userId: req.user.id
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update Error:', error);
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'PO Number already exists. Cannot update to this number.' });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Generate RFID Tags (Serial Numbers) for an Inbound PO
 * @route   POST /api/inbound/:id/generate-tags
 */
export const generateTags = async (req, res) => {
  try {
    const { id } = req.params;
    const inbound = await prisma.inbound.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { serialNumbers: true } } }
    });

    if (!inbound) return res.status(404).json({ message: 'Record not found' });
    if (inbound._count.serialNumbers > 0) {
      return res.status(400).json({ message: 'Tags are already generated for this PO.' });
    }

    if (!inbound.no_of_box || inbound.no_of_box <= 0) {
      return res.status(400).json({ message: 'No of Boxes is zero or empty. Please update the record first.' });
    }

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${inbound.po_no}-${yy}${mm}`;

    const tags = [];
    for (let i = 1; i <= inbound.no_of_box; i++) {
      const code = `${prefix}-${i.toString().padStart(5, '0')}`;
      tags.push({
        code,
        inboundId: inbound.id,
        status: 'PRINTED'
      });
    }

    await prisma.serialNumber.createMany({ data: tags });

    // Log the generation
    await prisma.inboundLog.create({
      data: {
        inboundId: inbound.id,
        action: 'RFID Tags Generated',
        details: `Successfully generated ${inbound.no_of_box} tags with pattern ${prefix}-XXXXX`,
        userId: req.user.id
      }
    });

    res.json({ success: true, count: tags.length, pattern: prefix + '-XXXXX' });
  } catch (error) {
    console.error('Tag Gen Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get tracking movements for all tags in an Inbound PO
 * @route   GET /api/inbound/:id/movements
 */
export const getMovements = async (req, res) => {
  try {
    const { id } = req.params;
    const serialNumbers = await prisma.serialNumber.findMany({
      where: { inboundId: parseInt(id) },
      include: {
        history: true,
        grid: { select: { code: true } }
      },
      orderBy: { code: 'asc' }
    });

    const mapped = serialNumbers.map(sn => {
      const findTime = (status) => sn.history.find(h => h.status === status)?.timestamp;
      return {
        code: sn.code,
        status: sn.status,
        grid: sn.grid?.code || '-',
        createdAt: sn.createdAt,
        gateScan: findTime('IN_GATE'),
        gridPlace: findTime('PLACED'),
        pickupScan: findTime('PICKED'),
        outgateScan: findTime('OUT_GATE')
      };
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
