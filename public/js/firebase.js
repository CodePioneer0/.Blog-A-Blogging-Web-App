const firebaseConfig = {
  apiKey: "AIzaSyBjimFnNH0Ix7GMpQ019gle42NUnkOb_IY",
  authDomain: "blogging-site-be4b6.firebaseapp.com",
  projectId: "blogging-site-be4b6",
  storageBucket: "blogging-site-be4b6.appspot.com",
  messagingSenderId: "739726643128",
  appId: "1:739726643128:web:5af9e2bf942fa7f526494d",
};

// Initialize Firebase
try {
  const app = firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");

  // Initialize Firestore
  const db = firebase.firestore();
  console.log("Firestore initialized successfully");

  // Test connection
  db.enableNetwork()
    .then(() => {
      console.log("Firestore connection enabled");
    })
    .catch((error) => {
      console.error("Error enabling Firestore network:", error);
    });
} catch (error) {
  console.error("Error initializing Firebase:", error);
}
