const admin = require('firebase-admin');
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
const serviceAccount = require(
  path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS),
);

const email = 'mohdsakib@krapton.com';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`✅ Admin claim set successfully for ${email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
