import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING DASHBOARD DATA ---');

  // 1. Get Admin User
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('No admin user found. Run init_db.js first.');
    return;
  }

  // 2. Get/Create Warehouse & Shed
  let warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'Mumbai Central Logistics',
        city: 'Mumbai',
        address: 'Sector 10, JNPT',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000'
      }
    });
  }

  let shed = await prisma.shed.findFirst({ where: { warehouseId: warehouse.id } });
  if (!shed) {
    shed = await prisma.shed.create({
      data: {
        name: 'Hazardous Goods Hub (Shed A)',
        warehouseId: warehouse.id
      }
    });
  }

  // 3. Create Grids if not exist
  const gridCount = await prisma.grid.count({ where: { shedId: shed.id } });
  if (gridCount === 0) {
    console.log('Creating 50 grid locations...');
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 10; j++) {
        await prisma.grid.create({
          data: {
            code: `S1-R${i}-C${j}`,
            barcode: `BC-S1-R${i}-C${j}`,
            x: i * 2,
            y: 0,
            z: j * 2,
            shedId: shed.id
          }
        });
      }
    }
  }

  const grids = await prisma.grid.findMany({ where: { shedId: shed.id } });

  // 4. Create 15 Inbound POs (Total)
  const poData = [
    { po: 'PO-2024-001', desc: 'BACARDI CARTA BLANCA RUM', boxes: 120, qty: 720 },
    { po: 'PO-2024-002', desc: 'JOHNNIE WALKER BLACK LABEL', boxes: 85, qty: 510 },
    { po: 'PO-2024-003', desc: 'GREY GOOSE VODKA 750ML', boxes: 200, qty: 1200 },
    { po: 'PO-2024-004', desc: 'CHIVAS REGAL 12Y', boxes: 45, qty: 270 },
    { po: 'PO-2024-005', desc: 'HENNESSY VS COGNAC', boxes: 60, qty: 360 },
    { po: 'PO-2024-006', desc: 'SMIRNOFF RED VODKA', boxes: 150, qty: 900 },
    { po: 'PO-2024-007', desc: 'BOMBAY SAPPHIRE GIN', boxes: 90, qty: 540 },
    { po: 'PO-2024-008', desc: 'JACK DANIELS OLD NO 7', boxes: 110, qty: 660 },
    { po: 'PO-2024-009', desc: 'GLENFIDDICH 12Y SINGLE MALT', boxes: 30, qty: 180 },
    { po: 'PO-2024-010', desc: 'ABSORBENT COTTON ROLL', boxes: 500, qty: 5000 },
    { po: 'PO-2024-011', desc: 'MEDICAL GLOVES LATEX', boxes: 1000, qty: 100000 },
    { po: 'PO-2024-012', desc: 'SURGICAL MASKS 3-PLY', boxes: 400, qty: 20000 },
    { po: 'PO-2024-013', desc: 'MACALLAN SHERRY OAK 12Y', boxes: 24, qty: 144 },
    { po: 'PO-2024-014', desc: 'PATRON SILVER TEQUILA', boxes: 48, qty: 288 },
    { po: 'PO-2024-015', desc: 'MOET & CHANDON IMPERIAL', boxes: 72, qty: 432 },
  ];

  for (const item of poData) {
    console.log(`Processing Inbound: ${item.po}`);
    const inbound = await prisma.inbound.upsert({
      where: { po_no: item.po },
      update: { 
        quantity: item.qty, 
        no_of_box: item.boxes,
        product_description: item.desc 
      },
      create: {
        po_no: item.po,
        inv_no: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        awb_no: 'AWB-' + Math.floor(100000 + Math.random() * 900000),
        product_description: item.desc,
        quantity: item.qty,
        no_of_box: item.boxes,
        qty_per_box: item.qty / item.boxes,
        status: 'IN_PROCESS',
        warehouse_location: shed.name,
        assignedUserId: admin.id
      }
    });

    // Create Serial Numbers and place them
    const existingSN = await prisma.serialNumber.count({ where: { inboundId: inbound.id } });
    if (existingSN < 10) { // Ensure at least 10 tags per PO
      const toCreate = 10 - existingSN;
      for (let b = 1; b <= toCreate; b++) {
        const snCode = `${item.po.slice(-3)}-B${(existingSN + b).toString().padStart(3, '0')}`;
        const randomGrid = grids[Math.floor(Math.random() * grids.length)];
        
        const sn = await prisma.serialNumber.create({
          data: {
            code: snCode,
            inboundId: inbound.id,
            shedId: shed.id,
            gridId: randomGrid.id,
            status: 'PLACED'
          }
        });

        // Add history
        await prisma.auditLog.create({
          data: {
            serialNumberId: sn.id,
            status: 'IN_GATE',
            location: 'Gate 1',
            userId: admin.id
          }
        });
        await prisma.auditLog.create({
          data: {
            serialNumberId: sn.id,
            status: 'PLACED',
            location: randomGrid.code,
            userId: admin.id
          }
        });
      }
    }
  }

  // 5. Create more exceptions
  const posForExceptions = await prisma.inbound.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
  for (const po of posForExceptions) {
     const exists = await prisma.exception.findFirst({ where: { inboundId: po.id } });
     if (!exists) {
        await prisma.exception.create({
          data: {
            note: 'Verification pending: Item count mismatch',
            inboundId: po.id,
            userId: admin.id,
            isResolved: false
          }
        });
     }
  }

  // 6. Create more Outbounds
  const outpos = await prisma.inbound.findMany({ skip: 5, take: 3 });
  for (const po of outpos) {
    const exists = await prisma.outbound.findFirst({ where: { inboundId: po.id } });
    if (!exists) {
        const ob = await prisma.outbound.create({
          data: {
            inboundId: po.id,
            customerName: 'Airlift Logistics India',
            demandQty: Math.floor(po.quantity * 0.2),
            status: 'IN_PROCESS',
            assignedUserId: admin.id,
            lines: {
              create: {
                date: new Date(),
                flightNo: 'AI-' + Math.floor(100 + Math.random() * 900),
                sbNo: 'SB-' + Math.floor(10000 + Math.random() * 90000),
                quantityIssued: Math.floor(po.quantity * 0.1),
                noOfBoxes: Math.floor(po.no_of_box * 0.1) || 1,
                balance: Math.floor(po.quantity * 0.1),
                postedByUserId: admin.id,
                status: 'pending'
              }
            }
          }
        });

        // Add an exception for one of them
        if (Math.random() > 0.5) {
           const line = await prisma.outboundLine.findFirst({ where: { outboundId: ob.id } });
           await prisma.exception.create({
              data: {
                note: 'Customs clearance delayed',
                outboundLineId: line.id,
                userId: admin.id,
                isResolved: false
              }
           });
        }
    }
  }

  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
