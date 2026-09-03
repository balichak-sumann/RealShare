import * as dotenv from 'dotenv'
import { createPrismaClient } from './db'

dotenv.config()

const prisma = createPrismaClient()

async function main() {
  console.log('Fetching profiles...')
  
  const employee = await prisma.profile.findFirst({ where: { email: 'emp@realshare.com' } })
  const investor = await prisma.profile.findFirst({ where: { email: 'investor@realshare.com' } })
  
  if (!employee || !investor) {
    console.error('Could not find either emp@realshare.com or investor@realshare.com')
    return
  }
  
  console.log(`Assigning investor ${investor.full_name} to employee ${employee.full_name}...`)
  
  await prisma.profile.update({
    where: { id: investor.id },
    data: { assigned_sales_rep_id: employee.id }
  })
  
  console.log('Successfully assigned investor to employee!')
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect() })
