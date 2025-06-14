const blogTitleField = document.querySelector(".title");
const articleFeild = document.querySelector(".article");

// banner
const bannerImage = document.querySelector("#banner-upload");
const banner = document.querySelector(".banner");
let bannerPath;

const publishBtn = document.querySelector(".publish-btn");
const uploadInput = document.querySelector("#image-upload");

bannerImage.addEventListener("change", () => {
  uploadImage(bannerImage, "banner");
});

uploadInput.addEventListener("change", () => {
  uploadImage(uploadInput, "image");
});

const uploadImage = (uploadFile, uploadType) => {
  const [file] = uploadFile.files;
  if (file && file.type.includes("image")) {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    const formdata = new FormData();
    formdata.append("image", file);

    fetch("/upload", {
      method: "post",
      body: formdata,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }

        if (uploadType == "image") {
          addImage(data, file.name);
        } else {
          bannerPath = `${location.origin}/${data}`;
          banner.style.backgroundImage = `url("${bannerPath}")`;
        }
      })
      .catch((error) => {
        console.error("Upload error:", error);
        alert(`Upload failed: ${error.message}`);
      });
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
  if (articleFeild.value.length && blogTitleField.value.length) {
    // Check if banner image is uploaded
    if (!bannerPath) {
      alert("Please upload a banner image before publishing.");
      return;
    }

    // Validate content length
    if (blogTitleField.value.length < 5) {
      alert("Title must be at least 5 characters long.");
      return;
    }

    if (articleFeild.value.length < 50) {
      alert("Article must be at least 50 characters long.");
      return;
    }

    // generating unique id
    let blogTitle = blogTitleField.value
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ""); // Remove special characters
    let uniqueId = generateUniqueId();

    // setting up docName
    let docName = `${blogTitle}-${uniqueId}`;
    let date = new Date();

    // Disable publish button to prevent double publishing
    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    // Use the global waitForFirebase function
    (window.waitForFirebase || waitForFirebase)()
      .then((database) => {
        console.log("Firebase ready, publishing blog...");
        return database
          .collection("blogs")
          .doc(docName)
          .set({
            title: blogTitleField.value,
            article: articleFeild.value,
            bannerImage: bannerPath,
            publishedAt: `${date.getDate()} ${
              months[date.getMonth()]
            } ${date.getFullYear()}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      })
      .then(() => {
        console.log("Blog published successfully");
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
