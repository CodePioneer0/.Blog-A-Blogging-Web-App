// Extract and validate blog ID from URL
const getBlogId = () => {
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment.length > 0);
  const blogId =
    pathSegments.length > 0
      ? decodeURI(pathSegments[pathSegments.length - 1])
      : null;

  // Validate blog ID format (should not be empty and should be alphanumeric with hyphens)
  if (!blogId || blogId.trim() === "" || !/^[a-zA-Z0-9-_]+$/.test(blogId)) {
    return null;
  }

  return blogId;
};

let blogId = getBlogId();

// Function to load blog with better error handling
const loadBlog = async () => {
  try {
    // Check if we have a valid blog ID
    if (!blogId) {
      console.log("No valid blog ID found, redirecting to home");
      window.location.href = "/";
      return;
    }

    console.log("Starting to load blog:", blogId);
    console.log("Available globals:", {
      waitForFirebase: typeof window.waitForFirebase,
      db: typeof window.db,
      firebase: typeof firebase,
    });

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

    console.log("Firebase ready, fetching blog:", blogId);

    // Additional validation before making the Firebase call
    if (!blogId || blogId.trim() === "") {
      throw new Error("Invalid blog ID");
    }

    let docRef = database.collection("blogs").doc(blogId);
    const doc = await docRef.get();

    if (doc.exists) {
      console.log("Blog found, setting up...");
      setupBlog(doc.data());
    } else {
      console.log("Blog not found:", blogId);
      // Show 404 message instead of silent redirect
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1>Blog Not Found</h1>
          <p>The blog you're looking for doesn't exist or may have been removed.</p>
          <a href="/" style="color: #007bff; text-decoration: none; font-weight: bold;">← Go back to home</a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching blog:", error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>Error Loading Blog</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check your internet connection and try again.</p>
        <button onclick="loadBlog()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
        <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Refresh Page
        </button>
        <a href="/" style="display: inline-block; padding: 10px 20px; margin: 10px; color: #007bff; text-decoration: none; border: 1px solid #007bff; border-radius: 5px;">
          Go back to home
        </a>
      </div>
    `;
  }
};

// Start loading blog when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadBlog);
} else {
  loadBlog();
}

// Make loadBlog globally accessible for retry button
window.loadBlog = loadBlog;

// Simple HTML sanitization function
const sanitizeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

const setupBlog = (data) => {
  const banner = document.querySelector(".banner");
  const blogTitle = document.querySelector(".title");
  const titleTag = document.querySelector("title");
  const publish = document.querySelector(".published");

  // Safely set background image
  if (data.bannerImage) {
    banner.style.backgroundImage = `url(${data.bannerImage})`;
  }

  // Sanitize and set title
  const sanitizedTitle = sanitizeHTML(data.title);
  blogTitle.innerHTML = sanitizedTitle;
  titleTag.innerHTML = `Blog : ${sanitizedTitle}`;
  publish.innerHTML = `published at - ${sanitizeHTML(data.publishedAt)}`;

  const article = document.querySelector(".article");
  addArticle(article, data.article);
};

const addArticle = (ele, data) => {
  if (!data) return;

  const lines = data.split("\n").filter((item) => item.length);

  lines.forEach((item) => {
    // check for heading
    if (item[0] == "#") {
      let hCount = 0;
      let i = 0;
      while (item[i] == "#" && hCount < 6) {
        // Limit to h6
        hCount++;
        i++;
      }
      let tag = `h${hCount}`;
      const headingText = sanitizeHTML(item.slice(hCount).trim());
      ele.innerHTML += `<${tag}>${headingText}</${tag}>`;
    }
    //checking for image format
    else if (item[0] == "!" && item[1] == "[") {
      let seperator = -1;

      for (let i = 0; i < item.length; i++) {
        if (
          item[i] == "]" &&
          item[i + 1] == "(" &&
          item[item.length - 1] == ")"
        ) {
          seperator = i;
          break;
        }
      }

      if (seperator !== -1) {
        let alt = sanitizeHTML(item.slice(2, seperator));
        let src = item.slice(seperator + 2, item.length - 1);

        // Basic URL validation
        if (src.match(/^(https?:\/\/|\/)/)) {
          ele.innerHTML += `<img src="${src}" alt="${alt}" class="article-image" loading="lazy">`;
        }
      }
    } else {
      // Regular paragraph - sanitize content
      const sanitizedContent = sanitizeHTML(item);
      ele.innerHTML += `<p>${sanitizedContent}</p>`;
    }
  });
};
