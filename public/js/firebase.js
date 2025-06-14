let firebaseApp, db;
let firebaseInitialized = false;

// Helper function to test Firestore connection and permissions
const testFirestoreConnection = async (database) => {
  try {
    console.log("Testing Firestore connection...");

    // Test read permission
    const testRead = await database.collection("blogs").limit(1).get();
    console.log("✅ Firestore read permission: OK");

    // Test write permission with a temporary document
    const testDocRef = database.collection("blogs").doc("connection-test");
    await testDocRef.set({
      test: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Firestore write permission: OK");

    // Clean up test document
    await testDocRef.delete();
    console.log("✅ Firestore connection test completed successfully");

    return true;
  } catch (error) {
    console.error("❌ Firestore connection test failed:", error);

    if (error.code === "permission-denied") {
      throw new Error(
        "Permission denied. Please check your Firestore security rules."
      );
    } else if (error.code === "unavailable") {
      throw new Error(
        "Firestore service is currently unavailable. Please try again later."
      );
    } else {
      throw new Error(`Firestore error: ${error.message}`);
    }
  }
};

// Fetch Firebase config from server
const initializeFirebase = async () => {
  if (firebaseInitialized) return true;

  try {
    console.log("Current domain:", window.location.origin);
    console.log("Fetching Firebase config...");

    const response = await fetch("/firebase-config");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch Firebase config: ${response.status} - ${errorText}`
      );
    }

    const firebaseConfig = await response.json();
    console.log("Firebase config received:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });

    // Check if Firebase is available
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK not loaded from CDN");
    }

    // Validate Firebase config
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error("Invalid Firebase configuration received from server");
    }

    // Initialize Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");

    // Initialize Firestore with settings for better Vercel compatibility
    db = firebase.firestore();

    // Configure Firestore settings for production
    if (window.location.hostname !== "localhost") {
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true,
      });
    }

    // Enable offline persistence (helps with connectivity issues)
    try {
      await db.enablePersistence({ synchronizeTabs: true });
      console.log("Firestore persistence enabled");
    } catch (err) {
      if (err.code == "failed-precondition") {
        console.log("Persistence failed - multiple tabs open");
      } else if (err.code == "unimplemented") {
        console.log("Persistence not available in this browser");
      }
    }

    console.log("Firestore initialized successfully");

    // Test connection with timeout
    const testPromise = db
      .enableNetwork()
      .then(() => testFirestoreConnection(db));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Connection timeout after 15 seconds")),
        15000
      )
    );

    await Promise.race([testPromise, timeoutPromise]);
    console.log("Firestore connection and permissions verified");

    // Make db available globally
    window.db = db;

    firebaseInitialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing Firebase:", error);

    // Show detailed error message based on error type
    let errorMessage = error.message;
    let helpText = "";

    if (error.message.includes("Permission denied")) {
      helpText = `
        <br><strong>How to fix:</strong>
        <br>1. Go to <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a>
        <br>2. Select your project → Firestore → Rules
        <br>3. Update your security rules to allow read/write access
        <br>4. Click "Publish" to save the changes
      `;
    } else if (error.message.includes("Failed to fetch Firebase config")) {
      helpText = `
        <br><strong>Possible causes:</strong>
        <br>• Server environment variables not set in Vercel
        <br>• Network connectivity issues
        <br>• CORS configuration problems
      `;
    } else if (error.message.includes("auth/unauthorized-domain")) {
      helpText = `
        <br><strong>Domain not authorized:</strong>
        <br>1. Go to <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a>
        <br>2. Authentication → Settings → Authorized domains
        <br>3. Add your Vercel domain: <code>${window.location.hostname}</code>
        <br>4. Save and try again
      `;
    }

    // Show user-friendly error message
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 1000;
      max-width: 400px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    errorDiv.innerHTML = `
      <strong>Database Connection Error</strong><br>
      <strong>Domain:</strong> ${window.location.origin}<br>
      <strong>Error:</strong> ${errorMessage}${helpText}<br>
      <button onclick="location.reload()" style="margin-top:10px; padding:5px 10px; background:white; color:#ff4444; border:none; border-radius:3px; cursor:pointer;">
        Retry
      </button>
    `;
    document.body.appendChild(errorDiv);

    return false;
  }
};

// Helper function to wait for Firebase initialization
const waitForFirebase = () => {
  return new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max
    let attempts = 0;

    const checkFirebase = () => {
      attempts++;
      if (firebaseInitialized && db && typeof firebase !== "undefined") {
        resolve(db);
      } else if (attempts >= maxAttempts) {
        reject(new Error("Firebase initialization timeout"));
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
};

// Helper function to get server timestamp safely
const getServerTimestamp = () => {
  if (typeof firebase !== "undefined" && firebase.firestore) {
    return firebase.firestore.FieldValue.serverTimestamp();
  } else {
    console.warn("Firebase not available, using client timestamp");
    return new Date();
  }
};

// Diagnostic function to test Firebase connectivity
const testFirebaseConnectivity = async () => {
  try {
    console.log("Testing basic Firebase connectivity...");

    if (!window.db) {
      throw new Error("Database not initialized");
    }

    // Simple test - try to access the collection
    const testCollection = window.db.collection("blogs");
    console.log("✅ Collection access: OK");

    // Try a simple query
    const testQuery = await testCollection.limit(1).get();
    console.log("✅ Query execution: OK", `Found ${testQuery.size} documents`);

    return true;
  } catch (error) {
    console.error("❌ Firebase connectivity test failed:", error);
    return false;
  }
};

// Initialize Firebase when DOM is ready
const startFirebaseInit = () => {
  console.log("Starting Firebase initialization...");
  initializeFirebase().then((success) => {
    if (success) {
      console.log("Firebase initialization completed successfully");
      // Trigger a custom event that other scripts can listen to
      window.dispatchEvent(
        new CustomEvent("firebaseReady", { detail: { db: window.db } })
      );
    } else {
      console.error("Firebase initialization failed");
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startFirebaseInit);
} else {
  startFirebaseInit();
}

// Export for other scripts
window.waitForFirebase = waitForFirebase;
window.getServerTimestamp = getServerTimestamp;
window.testFirebaseConnectivity = testFirebaseConnectivity;
