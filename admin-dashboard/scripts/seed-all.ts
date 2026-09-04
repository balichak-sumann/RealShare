import * as dotenv from 'dotenv'
import { createPrismaClient } from './db'
import { v4 as uuidv4 } from 'uuid';

dotenv.config()

const prisma = createPrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // 1. Clear existing data to avoid conflicts
  console.log('🧹 Clearing existing data (except developers)...')
  await prisma.transaction.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.agentCommission.deleteMany()
  await prisma.agentClientProperty.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.agentClient.deleteMany()
  await prisma.propertyImage.deleteMany()
  await prisma.shortlist.deleteMany()
  await prisma.property.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.serviceInquiry.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.rentalStatement.deleteMany()
  await prisma.rentalAgreement.deleteMany()
  await prisma.assetDocument.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.kycDocument.deleteMany()
  await prisma.profile.deleteMany()
  
  // 2. Create Users (Investors, Agents, Admins, Employees)
  console.log('👥 Seeding Users...')
  const admin = await prisma.profile.create({
    data: {
      id: uuidv4(),
      full_name: 'Super Admin',
      email: 'admin@realshare.in',
      role: 'admin',
      kyc_status: 'verified',
    }
  })

  const investor1 = await prisma.profile.create({
    data: {
      id: uuidv4(),
      full_name: 'Rahul Sharma',
      email: 'rahul.investor@example.com',
      phone_number: '+919876543210',
      role: 'investor',
      kyc_status: 'verified',
      wallet_balance: 500000,
    }
  })

  const investor2 = await prisma.profile.create({
    data: {
      id: uuidv4(),
      full_name: 'Sneha Patel',
      email: 'sneha.p@example.com',
      phone_number: '+919876543211',
      role: 'investor',
      kyc_status: 'pending',
      wallet_balance: 100000,
    }
  })

  const agent = await prisma.profile.create({
    data: {
      id: uuidv4(),
      full_name: 'Vikram Singh (Agent)',
      email: 'vikram.agent@example.com',
      phone_number: '+919876543212',
      role: 'agent',
      referral_code: 'VIKRAM2026',
      commission_rate_pct: 2.5,
      kyc_status: 'verified',
    }
  })

  const employee = await prisma.profile.create({
    data: {
      id: uuidv4(),
      full_name: 'Priya Support',
      email: 'priya@realshare.in',
      role: 'employee',
      employee_department: 'support',
      kyc_status: 'verified',
    }
  })

  // 3. Create Properties (Fractional & Outright)
  console.log('🏢 Seeding Properties...')
  const developers = await prisma.developer.findMany()
  const devId = developers.length > 0 ? developers[0].id : undefined

  const prop1 = await prisma.property.create({
    data: {
      title: 'Skyline Commercial Park',
      description: 'Grade A office space in Gachibowli with 12% assured yield.',
      property_type: 'commercial',
      listing_type: 'fractional',
      total_fractions: 10000,
      available_fractions: 4000,
      sold_fractions: 6000,
      price_per_fraction: 20000,
      booking_amount: 50000,
      assured_yield: 12.0,
      target_irr: 16.5,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Gachibowli',
      lat: 17.4401,
      lng: 78.3489,
      approval_status: 'approved',
      featured: true,
      developer_id: devId,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', is_primary: true },
          { image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', is_primary: false }
        ]
      }
    }
  })

  const prop2 = await prisma.property.create({
    data: {
      title: 'Luxury 4BHK Villa - Outright',
      description: 'Fully furnished 4BHK villa in Jubilee Hills for outright purchase.',
      property_type: 'residential',
      listing_type: 'outright',
      total_fractions: 1,
      available_fractions: 1,
      sold_fractions: 0,
      price_per_fraction: 45000000,
      booking_amount: 500000,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Jubilee Hills',
      approval_status: 'approved',
      featured: true,
      developer_id: devId,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', is_primary: true }
        ]
      }
    }
  })

  const prop3 = await prisma.property.create({
    data: {
      title: 'Co-living Space Hitec City',
      description: 'High yield co-living space near Cyber Towers.',
      property_type: 'coliving',
      listing_type: 'fractional',
      total_fractions: 5000,
      available_fractions: 5000,
      sold_fractions: 0,
      price_per_fraction: 10000,
      booking_amount: 25000,
      assured_yield: 9.0,
      target_irr: 14.0,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Hitec City',
      approval_status: 'approved',
      featured: false,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', is_primary: true }
        ]
      }
    }
  })

  // 4. Create Investments & Transactions
  console.log('💰 Seeding Investments & Transactions...')
  const investment = await prisma.investment.create({
    data: {
      user_id: investor1.id,
      property_id: prop1.id,
      fractions_bought: 50,
      total_amount: 1000000,
      booking_amount_paid: 50000,
      ownership_percentage: 0.5,
      certificate_number: 'CERT-10293',
      status: 'completed',
    }
  })

  await prisma.transaction.create({
    data: {
      user_id: investor1.id,
      property_id: prop1.id,
      investment_id: investment.id,
      transaction_type: 'fraction_purchase',
      amount: 1000000,
      payment_method: 'UPI',
      payment_status: 'completed',
      gateway_txn_id: 'pay_xyz12345'
    }
  })

  // 5. Agent Commissions
  console.log('🤝 Seeding Agent Commissions...')
  await prisma.agentCommission.create({
    data: {
      agent_id: agent.id,
      investor_id: investor1.id,
      property_id: prop1.id,
      investment_id: investment.id,
      commission_percentage: 2.5,
      commission_amount: 25000,
      status: 'pending_clearance',
    }
  })

  // 6. Agent Clients (Leads) & Chat
  console.log('📝 Seeding Agent Leads & Chats...')
  const lead = await prisma.agentClient.create({
    data: {
      agent_id: agent.id,
      client_name: 'Suresh Kumar',
      phone_number: '+919988776655',
      target_budget: '50L - 1Cr',
      status: 'Hot Lead'
    }
  })

  await prisma.agentClientProperty.create({
    data: {
      client_id: lead.id,
      property_id: prop1.id
    }
  })

  await prisma.chatMessage.create({
    data: {
      agent_id: agent.id,
      client_id: lead.id,
      message: 'Hi Suresh, did you get a chance to review the Skyline property brochure?',
      sender: 'agent'
    }
  })

  // 7. Banners
  console.log('🎨 Seeding Banners...')
  await prisma.banner.createMany({
    data: [
      {
        title: 'Invest in Grade A Commercial',
        subtitle: 'Earn up to 12% Assured Yield',
        badge: 'New Opportunity',
        image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        sort_order: 1
      },
      {
        title: 'Fractional Real Estate Revolution',
        subtitle: 'Start with just ₹10,000',
        image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeefa?w=1200',
        sort_order: 2
      }
    ]
  })

  // 8. Notifications
  console.log('📢 Seeding Notifications...')
  await prisma.notification.create({
    data: {
      title: 'New Property Listed!',
      body: 'Check out the new Co-living space in Hitec City. Funding closes soon.',
      audience: 'all',
      recipients_count: 500
    }
  })

  // 9. Service Inquiries
  console.log('🛎️ Seeding Service Inquiries...')
  await prisma.serviceInquiry.create({
    data: {
      customer_name: 'Amit Verma',
      phone: '9876541230',
      service_type: 'Property Management',
      status: 'New'
    }
  })

  // 10. Support Tickets
  console.log('🎫 Seeding Support Tickets...')
  await prisma.supportTicket.create({
    data: {
      user_id: investor1.id,
      ticket_number: 'TKT-9912',
      category: 'Payment Issue',
      subject: 'Transaction failed but money deducted',
      description: 'My UPI payment failed yesterday but the amount was debited.',
      priority: 'high',
      status: 'open',
      assigned_to: employee.id
    }
  })

  // 11. Assets & Rentals
  console.log('🏠 Seeding Managed Assets & Rentals...')
  const asset = await prisma.asset.create({
    data: {
      user_id: investor1.id,
      title: 'My 2BHK in Gachibowli',
      property_type: 'residential',
      address: 'Flat 402, Sunshine Apts, Gachibowli',
      purchase_price: 8500000,
      status: 'active'
    }
  })

  const rental = await prisma.rentalAgreement.create({
    data: {
      asset_id: asset.id,
      tenant_name: 'Anjali Desai',
      start_date: new Date('2025-01-01'),
      end_date: new Date('2026-12-31'),
      monthly_rent: 35000,
      security_deposit: 70000,
      status: 'active'
    }
  })

  await prisma.rentalStatement.create({
    data: {
      agreement_id: rental.id,
      month_year: 'Sep 2026',
      amount_paid: 35000,
      payment_date: new Date('2026-09-01'),
      status: 'paid'
    }
  })

  console.log('🎉 Done! Comprehensive seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
