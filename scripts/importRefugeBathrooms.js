// Usage: node scripts/importRefugeBathrooms.js
// Requires: npm install firebase-admin node-fetch

const admin = require('firebase-admin');
const fetch = require('node-fetch');
const serviceAccount = require('./firebaseServiceAccount.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const BATHROOMS_COLLECTION = 'bathrooms';

// Fetch bathrooms from Refuge Restrooms API (paginated)
async function fetchRefugeBathrooms(page = 1, perPage = 100) {
  const url = `https://www.refugerestrooms.org/api/v1/restrooms?page=${page}&per_page=${perPage}&unisex=true&ada=true&country=US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

// Convert Refuge format to your Bathroom format
function toBathroom(doc) {
  return {
    name: doc.name || 'Public Restroom',
    address: doc.street || '',
    latitude: doc.latitude ? parseFloat(doc.latitude) : 0,
    longitude: doc.longitude ? parseFloat(doc.longitude) : 0,
    isOpen: true, // Refuge does not provide hours
    isFree: true, // Assume public
    isAccessible: !!doc.accessible,
    hasChangingTable: !!doc.changing_table,
    rating: doc.upvote - doc.downvote,
    hours: '',
    id: undefined, // Firestore will assign
  };
}

async function importBathrooms(maxPages = 10) {
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const data = await fetchRefugeBathrooms(page);
    if (!data.length) break;
    for (const doc of data) {
      const bathroom = toBathroom(doc);
      if (!bathroom.latitude || !bathroom.longitude) continue;
      await db.collection(BATHROOMS_COLLECTION).add(bathroom);
      total++;
    }
    console.log(`Imported page ${page}, total so far: ${total}`);
  }
  console.log(`Done. Imported ${total} bathrooms.`);
}

importBathrooms(10).catch(err => {
  console.error(err);
  process.exit(1);
});
