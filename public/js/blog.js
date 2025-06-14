let blogId = decodeURI(location.pathname.split("/").pop());

// Use the global waitForFirebase function
(window.waitForFirebase || waitForFirebase)()
  .then((database) => {
    console.log("Firebase ready, fetching blog:", blogId);
    let docRef = database.collection("blogs").doc(blogId);
    return docRef.get();
  })
  .then((doc) => {
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
  })
  .catch((error) => {
    console.error("Error fetching blog:", error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>Error Loading Blog</h1>
        <p>There was an error loading this blog: ${error.message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
        <a href="/" style="display: inline-block; padding: 10px 20px; margin: 10px; color: #007bff; text-decoration: none; border: 1px solid #007bff; border-radius: 5px;">
          Go back to home
        </a>
      </div>
    `;
  });

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
