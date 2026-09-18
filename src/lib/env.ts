function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  firebaseProjectId: () => required('FIREBASE_PROJECT_ID'),
  firebaseClientEmail: () => required('FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: () => required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  firebaseStorageBucket: () => required('FIREBASE_STORAGE_BUCKET'),
  adminAccessCode: () => required('ADMIN_ACCESS_CODE'),
  sessionSecret: () => required('SESSION_SECRET'),
  siteName: () => process.env.SITE_NAME?.trim() || 'คลังงานวิจัย',
};
