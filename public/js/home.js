// DOM Elements
const blogsGrid = document.getElementById("blogs-grid");
const loadingScreen = document.getElementById("loading-screen");
const loadMoreBtn = document.getElementById("load-more-btn");
const navbar = document.getElementById("navbar");

// State
let allBlogs = [];
let displayedBlogs = 0;
const blogsPerPage = 6;

// Simple HTML sanitization function
const sanitizeHTML = (str) => {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const estimateReadTime = (content) => {
  if (!content) return "1 min read";
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
};

// Loading and UI functions
const hideLoadingScreen = () => {
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 1000);
};

const showError = (message, isRetryable = true) => {
  blogsGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <h3>Oops! Something went wrong</h3>
      <p>${sanitizeHTML(message)}</p>
      ${
        isRetryable
          ? `
        <button onclick="loadBlogs()" class="btn btn-primary">
          Try Again
        </button>
      `
          : ""
      }
    </div>
  `;
};

const showEmptyState = () => {
  blogsGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <h3>No stories yet</h3>
      <p>Be the first to share your thoughts with the world!</p>
      <a href="/editor" class="btn btn-primary">Write Your First Story</a>
    </div>
  `;
};

// Stats animation
const animateStats = (blogs) => {
  const statNumbers = document.querySelectorAll(".stat-number");
  const stats = [
    blogs.length, // Published blogs
    Math.max(1, Math.floor(blogs.length * 0.7)), // Active writers (estimate)
    Math.max(blogs.length * 10, 100), // Total reads (estimate)
  ];

  statNumbers.forEach((element, index) => {
    const target = stats[index] || 0;
    const increment = target / 50;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString();
    }, 30);
  });
};

// Function to load blogs with better error handling
const loadBlogs = async () => {
  try {
    // Wait for Firebase to be ready using multiple fallback methods
    let database;
    if (window.waitForFirebase) {
      database = await window.waitForFirebase();
    } else if (window.db) {
      database = window.db;
    } else if (typeof db !== "undefined") {
      database = db;
    } else {
      throw new Error(
        "Firebase database not available. Please refresh the page."
      );
    }

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
        .limit(50); // Load more for better UX
    } catch (indexError) {
      console.warn("OrderBy failed, using simple query:", indexError);
      blogsQuery = database.collection("blogs").limit(50);
    }

    const blogsSnapshot = await blogsQuery.get();

    if (blogsSnapshot.empty) {
      showEmptyState();
      hideLoadingScreen();
      return;
    }

    // Store all blogs
    allBlogs = [];
    blogsSnapshot.forEach((doc) => {
      allBlogs.push({ id: doc.id, ...doc.data() });
    });

    // Sort by creation date if available
    allBlogs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.publishedAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.publishedAt || 0);
      return dateB - dateA;
    });

    // Display initial blogs
    displayedBlogs = 0;
    blogsGrid.innerHTML = "";
    displayMoreBlogs();

    // Animate stats
    animateStats(allBlogs);

    // Hide loading screen
    hideLoadingScreen();
  } catch (error) {
    console.error("Error fetching blogs:", error);
    showError(error.message);
    hideLoadingScreen();
  }
};

// Display more blogs function
const displayMoreBlogs = () => {
  const blogsToShow = allBlogs.slice(
    displayedBlogs,
    displayedBlogs + blogsPerPage
  );

  blogsToShow.forEach((blogData, index) => {
    setTimeout(() => {
      createBlogCard(blogData);
    }, index * 100); // Stagger animation
  });

  displayedBlogs += blogsToShow.length;

  // Show/hide load more button
  if (displayedBlogs >= allBlogs.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "block";
  }
};

// Create blog card with modern design
const createBlogCard = (blogData) => {
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const sanitizedTitle = sanitizeHTML(truncateText(blogData.title, 80));
  const sanitizedOverview = sanitizeHTML(truncateText(blogData.article, 150));
  const sanitizedBannerImage = blogData.bannerImage || "img/header.jpg";
  const formattedDate = formatDate(blogData.publishedAt);
  const readTime = estimateReadTime(blogData.article);

  const blogCard = document.createElement("div");
  blogCard.className = "blog-card fade-in";
  blogCard.innerHTML = `
    <img src="${sanitizedBannerImage}"
         class="blog-image"
         alt="Blog banner"
         loading="lazy"
         onerror="this.src='img/header.jpg'">
    <div class="blog-card-content">
      <div class="blog-meta">
        <span class="blog-date">${formattedDate}</span>
        <span class="blog-read-time">${readTime}</span>
      </div>
      <h3 class="blog-title">${sanitizedTitle}</h3>
      <p class="blog-overview">${sanitizedOverview}</p>
      <a href="/${blogData.id}" class="btn">Read Story</a>
    </div>
  `;

  blogsGrid.appendChild(blogCard);
};

// Event listeners
loadMoreBtn?.addEventListener("click", displayMoreBlogs);

// Navbar scroll effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar?.classList.add("scrolled");
  } else {
    navbar?.classList.remove("scrolled");
  }
});

// Smooth scroll for anchor links
document.addEventListener("click", (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadBlogs);
} else {
  loadBlogs();
}

// Make functions globally accessible
window.loadBlogs = loadBlogs;
window.displayMoreBlogs = displayMoreBlogs;
