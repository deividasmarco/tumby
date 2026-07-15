const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function deleteQueryInChunks(query) {
  const snap = await query.get();
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
}

/**
 * Deletes the caller's account: all their Firestore data (children, foodLogs,
 * mealPlans, user doc) and their Firebase Auth record.
 *
 * Runs with Admin privileges, so it bypasses security rules AND the client
 * SDK's "requires-recent-login" rule — the user never has to sign in again.
 */
exports.deleteAccount = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to delete your account.');
  }

  try {
    // Owned data is keyed by parentId === uid.
    const foodLogs = await deleteQueryInChunks(db.collection('foodLogs').where('parentId', '==', uid));
    const mealPlans = await deleteQueryInChunks(db.collection('mealPlans').where('parentId', '==', uid));
    const children = await deleteQueryInChunks(db.collection('children').where('parentId', '==', uid));
    await db.collection('users').doc(uid).delete();

    // Delete the auth record last.
    await admin.auth().deleteUser(uid);

    return { success: true, deleted: { foodLogs, mealPlans, children } };
  } catch (err) {
    console.error('[deleteAccount] failed for uid', uid, err);
    throw new HttpsError('internal', 'Account deletion failed. Please try again.');
  }
});
