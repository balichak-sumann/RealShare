import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.developer.count()
  const devs = await prisma.developer.findMany({ select: { name: true } })
  console.log(`Count: ${count}`)
  console.log(devs.map(d => d.name).join(', '))
}
main().finally(() => prisma.$disconnect())
