import admin from 'firebase-admin';
import { resolve } from 'path';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const email = process.argv[2] || 'mohdsakib@krapton.com';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  console.log('Usage: node setAdminClaim.mjs [email@example.com]');
  process.exit(1);
}

// Simple check: if GOOGLE_APPLICATION_CREDENTIALS starts with '{', it's JSON
const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = credentialsEnv.startsWith('{')
  ? JSON.parse(credentialsEnv)
  : JSON.parse(readFileSync(resolve(credentialsEnv), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log(`🔍 Setting admin privileges for: ${email}`);

admin
  .auth()
  .getUserByEmail(email)
  .then((user) => {
    console.log(
      `✅ User found: ${user.displayName || user.email} (UID: ${user.uid})`,
    );

    // Check if user already has admin claim
    if (user.customClaims && user.customClaims.admin) {
      console.log('ℹ️  User already has admin privileges');
      return Promise.resolve();
    }

    console.log('🔄 Setting admin claim...');
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`✅ Admin claim set successfully for ${email}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log(
      '1. User needs to sign out and sign in again for changes to take effect',
    );
    console.log(
      '2. Admin can now create, update, and delete restaurants in the system',
    );
    process.exit(0);
  })
  .catch((error) => {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: User with email ${email} not found`);
      console.log(
        '💡 Make sure the user has signed up in your application first',
      );
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  });
