const blogTitleField = document.querySelector(".title");
const articleFeild = document.querySelector(".article");

// banner
const bannerImage = document.querySelector("#banner-upload");
const banner = document.querySelector(".banner");
let bannerPath;

// Auto-resize textareas
const autoResize = (textarea) => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
};

// Add auto-resize functionality to textareas
blogTitleField.addEventListener("input", () => autoResize(blogTitleField));
articleFeild.addEventListener("input", () => autoResize(articleFeild));

// Initialize auto-resize on page load
document.addEventListener("DOMContentLoaded", () => {
  autoResize(blogTitleField);
  autoResize(articleFeild);
});

// Enhanced writing experience - remove any restrictions
blogTitleField.removeAttribute("maxlength");
articleFeild.removeAttribute("maxlength");

// Add keyboard shortcuts for better writing experience
document.addEventListener("keydown", (e) => {
  // Ctrl+Enter to publish
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    publishBtn.click();
  }

  // Ctrl+S to save draft (could be implemented later)
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    // Save draft functionality could be added here
  }
});

// Add visual feedback for keyboard shortcuts
const addShortcutHint = () => {
  const hint = document.createElement("div");
  hint.className = "keyboard-hint";
  hint.innerHTML = `
    <small style="color: var(--text-muted); font-size: 12px; position: fixed; bottom: 100px; right: 20px; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 6px; backdrop-filter: blur(10px);">
      💡 Tip: Press Ctrl+Enter to publish
    </small>
  `;
  document.body.appendChild(hint);

  // Hide hint after 5 seconds
  setTimeout(() => {
    hint.style.opacity = "0";
    setTimeout(() => hint.remove(), 300);
  }, 5000);
};

// Show hint when user starts typing
let hintShown = false;
articleFeild.addEventListener("input", () => {
  if (!hintShown && articleFeild.value.length > 50) {
    addShortcutHint();
    hintShown = true;
  }
});

const publishBtn = document.querySelector(".publish-btn");
const uploadInput = document.querySelector("#image-upload");

bannerImage.addEventListener("change", () => {
  uploadImage(bannerImage, "banner");
});

uploadInput.addEventListener("change", () => {
  uploadImage(uploadInput, "image");
});

// Cloudinary upload function
const uploadImageToCloudinary = async (file, uploadType) => {
  try {
    // Show upload progress for banner
    if (uploadType === "banner") {
      banner.style.opacity = "0.5";
      banner.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-size: 18px; background: rgba(0,0,0,0.5);">Uploading to Cloudinary...</div>';
    }

    // Create FormData for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "blog_images");
    formData.append("folder", "blog-app");

    // Upload to Cloudinary
    const CLOUDINARY_CLOUD_NAME = "diuzofxcw";
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Fallback to server upload for local development
const uploadImageToServer = async (file) => {
  const formdata = new FormData();
  formdata.append("image", file);

  const response = await fetch("/upload", {
    method: "post",
    body: formdata,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown server error" }));
    throw new Error(
      `Upload failed (${response.status}): ${
        errorData.error || errorData.details || "Unknown error"
      }`
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return `${location.origin}/${data}`;
};

const uploadImage = async (uploadFile, uploadType) => {
  const [file] = uploadFile.files;
  if (file && file.type.includes("image")) {
    // Validate file size (10MB limit for Cloudinary free tier)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    try {
      let imageUrl;

      // Choose upload method based on environment
      if (window.location.hostname === "localhost") {
        // Local development - use server upload
        imageUrl = await uploadImageToServer(file, uploadType);
      } else {
        // Production - use Cloudinary
        imageUrl = await uploadImageToCloudinary(file, uploadType);
      }

      // Handle successful upload
      if (uploadType == "image") {
        addImage(imageUrl, file.name);
      } else {
        bannerPath = imageUrl;
        banner.style.backgroundImage = `url("${bannerPath}")`;
        banner.style.opacity = "1";
        banner.innerHTML = "";
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Reset banner state on error
      if (uploadType === "banner") {
        banner.style.opacity = "1";
        banner.innerHTML = "";
        banner.style.backgroundImage = 'url("img/header.jpg")';
      }

      // Show detailed error message
      const errorMessage = error.message.includes("Upload failed")
        ? error.message
        : `Upload failed: ${error.message}`;

      alert(
        `${errorMessage}\n\nPlease check your internet connection and try again.`
      );
    }
  } else {
    alert("Please upload images only");
  }
};

const addImage = (imagepath, alt) => {
  let curPos = articleFeild.selectionStart;
  let textToInsert = `\r![${alt}](${imagepath})\r`;
  articleFeild.value =
    articleFeild.value.slice(0, curPos) +
    textToInsert +
    articleFeild.value.slice(curPos);
};

let months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Generate a more unique ID using timestamp and random string
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

publishBtn.addEventListener("click", () => {
  if (articleFeild.value.trim().length && blogTitleField.value.trim().length) {
    // Check if banner image is uploaded
    if (!bannerPath) {
      alert("Please upload a banner image before publishing.");
      return;
    }

    // generating unique id
    let blogTitle = blogTitleField.value
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ""); // Remove special characters
    let uniqueId = generateUniqueId(); // setting up docName
    let docName = `${blogTitle}-${uniqueId}`;
    let date = new Date();

    // Disable publish button to prevent double publishing
    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    (
      window.waitForFirebase ||
      (() => Promise.reject(new Error("Firebase not initialized")))
    )()
      .then((database) => {
        const blogData = {
          title: blogTitleField.value,
          article: articleFeild.value,
          bannerImage: bannerPath,
          publishedAt: `${date.getDate()} ${
            months[date.getMonth()]
          } ${date.getFullYear()}`,
          createdAt: window.getServerTimestamp
            ? window.getServerTimestamp()
            : new Date(),
        };

        return database.collection("blogs").doc(docName).set(blogData);
      })
      .then(() => {
        location.href = `/${docName}`;
      })
      .catch((err) => {
        console.error("Publishing error:", err);
        alert(`Failed to publish blog: ${err.message}`);

        // Re-enable publish button
        publishBtn.disabled = false;
        publishBtn.textContent = "publish";
      });
  } else {
    alert("Please fill in both title and article before publishing.");
  }
});
