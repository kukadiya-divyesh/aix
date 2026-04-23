import prisma from '../config/prisma.js';

/**
 * @desc    Create Warehouse with Sheds and Grids (PostgreSQL/Prisma)
 * @route   POST /api/warehouses
 */
export const createWarehouse = async (req, res) => {
  try {
    const { name, city, image, sheds = [] } = req.body;
    
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        city,
        image,
        sheds: {
          create: sheds.map(shed => ({
            name: shed.name,
            locationCode: shed.locationCode,
            grids: {
              create: (shed.grids || []).map(grid => ({
                code: grid.code,
                barcode: grid.barcode,
                x: parseFloat(grid.x || 0),
                y: parseFloat(grid.y || 0),
                z: parseFloat(grid.z || 0)
              }))
            }
          }))
        }
      },
      include: {
        sheds: { include: { grids: true } }
      }
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update Warehouse
 * @route   PUT /api/warehouses/:id
 */
export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, image } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(id) },
      data: { name, city, image }
    });
    res.json(warehouse);
  } catch (error) {
    console.error('SERVER-SIDE UPDATE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all Sheds
 * @route   GET /api/warehouses/all/sheds
 */
export const getAllSheds = async (req, res) => {
  try {
    const sheds = await prisma.shed.findMany({
      include: { warehouse: { select: { name: true } }, _count: { select: { grids: true } } }
    });
    res.json(sheds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all Grids
 * @route   GET /api/warehouses/all/grids
 */
export const getAllGrids = async (req, res) => {
  try {
    const grids = await prisma.grid.findMany({
      include: { shed: { include: { warehouse: { select: { name: true } } } } }
    });
    res.json(grids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all warehouses
 * @route   GET /api/warehouses
 */
export const getWarehouses = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : {
      id: { in: req.user.warehouseAccess.map(w => w.id) }
    };

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        sheds: {
          include: {
            _count: {
              select: { grids: true }
            }
          }
        }
      }
    });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get specific warehouse (PostgreSQL/Prisma)
 * @route   GET /api/warehouses/:id
 */
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sheds: {
          include: {
            grids: {
              include: {
                _count: {
                  select: { serialNumbers: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * @desc    Delete Warehouse (Admin only)
 * @route   DELETE /api/warehouses/:id
 */
export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if any shed in this warehouse has active stock
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
      include: {
        sheds: {
          include: {
            _count: { select: { serialNumbers: true } }
          }
        }
      }
    });

    const hasStock = warehouse.sheds.some(s => s._count.serialNumbers > 0);
    if (hasStock) return res.status(400).json({ message: 'Cannot delete warehouse with active stock.' });

    await prisma.warehouse.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add Shed to Warehouse
 * @route   POST /api/warehouses/:id/sheds
 */
export const addShed = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, locationCode } = req.body;
    const shed = await prisma.shed.create({
      data: {
        name,
        locationCode,
        warehouseId: parseInt(id)
      }
    });
    res.status(201).json(shed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update Shed
 * @route   PUT /api/sheds/:id
 */
export const updateShed = async (req, res) => {
  const { id } = req.params;
  const { name, locationCode } = req.body;
  try {
    const shed = await prisma.shed.update({
      where: { id: parseInt(id) },
      data: { name, locationCode }
    });
    res.json(shed);
  } catch (error) {
    console.error('UPDATE SHED ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete Shed
 * @route   DELETE /api/sheds/:id
 */
export const deleteShed = async (req, res) => {
  try {
    const { id } = req.params;
    // Check for stock
    const snCount = await prisma.serialNumber.count({ where: { shedId: parseInt(id) } });
    if (snCount > 0) return res.status(400).json({ message: 'Cannot delete shed with active stock.' });

    await prisma.shed.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Shed deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add Grid to Shed
 * @route   POST /api/sheds/:id/grids
 */
export const addGrid = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, barcode, x, y, z } = req.body;
    const grid = await prisma.grid.create({
      data: {
        code,
        barcode,
        x: parseFloat(x || 0),
        y: parseFloat(y || 0),
        z: parseFloat(z || 0),
        shedId: parseInt(id)
      }
    });
    res.status(201).json(grid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete Grid
 * @route   DELETE /api/grids/:id
 */
export const deleteGrid = async (req, res) => {
  try {
    const { id } = req.params;
    // Check for stock
    const snCount = await prisma.serialNumber.count({ where: { gridId: parseInt(id) } });
    if (snCount > 0) return res.status(400).json({ message: 'Cannot delete grid with active items.' });

    await prisma.grid.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Grid deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update Grid
 * @route   PUT /api/grids/:id
 */
export const updateGrid = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, barcode, x, y, z, shedId } = req.body;
    const grid = await prisma.grid.update({
      where: { id: parseInt(id) },
      data: {
        code,
        barcode,
        x: parseFloat(x || 0),
        y: parseFloat(y || 0),
        z: parseFloat(z || 0),
        shedId: shedId ? parseInt(shedId) : undefined
      }
    });
    res.json(grid);
  } catch (error) {
    console.error('UPDATE GRID ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
