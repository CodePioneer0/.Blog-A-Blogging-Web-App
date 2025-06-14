const blogSection = document.querySelector(".blogs-section");

// Simple HTML sanitization function
const sanitizeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

// Use the global waitForFirebase function
(window.waitForFirebase || waitForFirebase)()
  .then((database) => {
    console.log("Firebase ready, fetching blogs...");
    return database
      .collection("blogs")
      .orderBy("createdAt", "desc")
      .limit(20) // Limit for better performance
      .get();
  })
  .then((blogs) => {
    if (blogs.empty) {
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
    const currentPath = decodeURI(location.pathname.split("/").pop());

    blogs.forEach((blog) => {
      if (blog.id !== currentPath) {
        createBlog(blog);
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching blogs:", error);
    blogSection.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h2>Error Loading Blogs</h2>
        <p>There was an error loading the blogs: ${error.message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  });

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
