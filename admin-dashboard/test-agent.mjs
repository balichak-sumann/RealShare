import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from admin-dashboard/.env
dotenv.config({ path: path.join(process.cwd(), '.env') });

function parseConnectionString(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306', 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

const dbConfig = parseConnectionString(process.env.DATABASE_URL || '');
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize Firebase Admin using env variables
const adminApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const adminAuth = getAdminAuth(adminApp);

const FIREBASE_API_KEY = 'AIzaSyBBrQWO23k-rgIoqEHQQmAeSuAC1dXgVCQ'; // From mobile .env

async function getFirebaseIdToken(uid) {
  // Generate a custom token using admin SDK
  const customToken = await adminAuth.createCustomToken(uid);
  
  // Exchange custom token for an ID token using Firebase REST API
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to exchange token');
  return data.idToken;
}

async function runAgentTest() {
  console.log("==========================================");
  console.log("🕵️  RUNNING AGENT PORTAL FUNCTIONALITY TEST");
  console.log("==========================================\n");

  const agentUid = 'test-agent-999';
  const agentEmail = 'superagent@test.com';

  try {
    console.log("1. Setting up Test Agent in Firebase...");
    try {
      await adminAuth.getUser(agentUid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await adminAuth.createUser({ uid: agentUid, email: agentEmail, emailVerified: true });
      } else throw e;
    }

    console.log("2. Generating Real Auth Token...");
    const token = await getFirebaseIdToken(agentUid);
    console.log("✅ Token successfully generated");

    console.log("\n3. Testing Agent Signup / Sync (POST /api/users/sync)");
    const syncRes = await fetch(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'agent' })
    });
    const syncData = await syncRes.json();
    if (syncRes.ok && syncData.profile?.role === 'agent') {
      console.log(`✅ Success: Agent account created/synced correctly in DB`);
    } else {
      console.log(`❌ Failed to sync:`, syncData);
      return;
    }

    console.log("\n4. Skipping fake data seeding (Testing fresh Agent Dashboard...)");

    console.log("\n5. Testing Agent Dashboard Data (GET /api/agents/dashboard)");
    const dashboardRes = await fetch(`${API_BASE_URL}/agents/dashboard`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (dashboardRes.ok) {
      const data = await dashboardRes.json();
      console.log(`✅ Success: Dashboard API returned the following features:`);
      console.log(`   - Referral Code: ${data.referralCode}`);
      console.log(`   - Total Earned: ${data.totalEarned}`);
      console.log(`   - Pending Comm: ${data.pendingPayout}`);
      console.log(`   - Client Leads: ${data.clientLeads.length}`);
      if (data.clientLeads.length > 0) {
        console.log(`   - First Lead: ${data.clientLeads[0].name} (Status: ${data.clientLeads[0].status})`);
      }
      
      if (data.clientLeads.length >= 1) {
         console.log("\n🎯 VERDICT: ALL AGENT FEATURES ARE FULLY FUNCTIONAL!");
      } else {
         console.log("\n⚠️ VERDICT: API worked but data didn't aggregate correctly.");
      }
    } else {
      console.log(`❌ Failed to load agent dashboard:`, await dashboardRes.text());
    }
    
  } catch (error) {
    console.error("\n❌ TEST FAILED WITH ERROR:", error);
  } finally {
    await prisma.profile.delete({ where: { id: agentUid } }).catch(() => {});
    await prisma.$disconnect();
    process.exit(0);
  }
}

runAgentTest();
