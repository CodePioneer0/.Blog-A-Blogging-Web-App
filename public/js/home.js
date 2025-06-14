const blogSection = document.querySelector(".blogs-section");

// Simple HTML sanitization function
const sanitizeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

// Function to load blogs with better error handling
const loadBlogs = async () => {
  try {
    console.log("Starting to load blogs...");
    console.log("Available globals:", {
      waitForFirebase: typeof window.waitForFirebase,
      db: typeof window.db,
      firebase: typeof firebase,
    });

    // Show loading state
    blogSection.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h2>Loading blogs...</h2>
        <p>Please wait while we fetch the latest blogs.</p>
      </div>
    `;

    // Wait for Firebase to be ready using multiple fallback methods
    let database;
    if (window.waitForFirebase) {
      console.log("Using window.waitForFirebase...");
      database = await window.waitForFirebase();
    } else if (window.db) {
      console.log("Using window.db...");
      database = window.db;
    } else if (typeof db !== "undefined") {
      console.log("Using global db...");
      database = db;
    } else {
      throw new Error(
        "Firebase database not available. Please refresh the page."
      );
    }
    console.log("Firebase ready, fetching blogs...");

    // Test basic connectivity first
    if (window.testFirebaseConnectivity) {
      const connectivityTest = await window.testFirebaseConnectivity();
      if (!connectivityTest) {
        throw new Error("Firebase connectivity test failed");
      }
    }

    // Try with orderBy first, fallback to simple query if index doesn't exist
    let blogsQuery;
    try {
      blogsQuery = database
        .collection("blogs")
        .orderBy("createdAt", "desc")
        .limit(20);
    } catch (indexError) {
      console.warn("OrderBy failed, using simple query:", indexError);
      blogsQuery = database.collection("blogs").limit(20);
    }

    const blogs = await blogsQuery.get();

    if (blogs.empty) {
      console.log("No blogs found");
      blogSection.innerHTML = `
        <div style="text-align: center; padding: 50px;">
          <h2>No blogs yet</h2>
          <p>Be the first to write a blog!</p>
          <a href="/editor" class="btn" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Write a Blog</a>
        </div>
      `;
      return;
    }

    console.log(`Found ${blogs.size} blogs`);

    // Clear loading message
    blogSection.innerHTML = "";

    const currentPath = decodeURI(location.pathname.split("/").pop());

    blogs.forEach((blog) => {
      if (blog.id !== currentPath) {
        createBlog(blog);
      }
    });

    console.log("Blogs loaded successfully");
  } catch (error) {
    console.error("Error loading blogs:", error);
    blogSection.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h2>Error Loading Blogs</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check your internet connection and try again.</p>
        <button onclick="loadBlogs()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
        <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
};

// Start loading blogs when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadBlogs);
} else {
  loadBlogs();
}

// Make loadBlogs globally accessible for retry button
window.loadBlogs = loadBlogs;

const createBlog = (blog) => {
  let data = blog.data();

  // Safely truncate title and article
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const sanitizedTitle = sanitizeHTML(truncateText(data.title, 100));
  const sanitizedOverview = sanitizeHTML(truncateText(data.article, 200));
  const sanitizedBannerImage = data.bannerImage || "img/header.jpg"; // Fallback image

  blogSection.innerHTML += `
    <div class="blog-card">
        <img src="${sanitizedBannerImage}" class="blog-image" alt="Blog banner" loading="lazy" onerror="this.src='img/header.jpg'">
        <h1 class="blog-title">${sanitizedTitle}</h1>
        <p class="blog-overview">${sanitizedOverview}</p>
        <a href="/${blog.id}" class="btn dark">read</a>
    </div>
    `;
};
