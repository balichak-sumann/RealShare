const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.property.findUnique({ where: { id: 'ba46bf6c-8c6d-435a-a856-2bad39b33ba7' } })
  .then(p => console.log('DATA:', p.area_sqft_max, p.rera_number, p.permission_number))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
