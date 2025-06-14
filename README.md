# .Blog - A Blogging Web App

A secure, modern blogging platform built with Node.js, Express, and Firebase.

## Features

- ✨ Create and publish blog posts with markdown support
- 🖼️ Image upload with secure file handling
- 📱 Responsive design
- 🔒 XSS protection and input sanitization
- 🚀 Real-time blog listing
- 📝 Rich text editor with image support

## Security Features

- Environment variable configuration for Firebase
- File upload validation and sanitization
- XSS protection with HTML sanitization
- Secure filename generation using UUIDs
- File size and type restrictions
- Error handling and user feedback

## Vercel Deployment

### Prerequisites

1. A Firebase project with Firestore enabled
2. A Vercel account

### Step-by-Step Deployment

1. **Prepare your Firebase project:**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Firestore Database
   - Go to Project Settings → General → Your apps
   - Copy your Firebase configuration values

2. **Deploy to Vercel:**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy from your project directory
   vercel
   ```

3. **Configure Environment Variables in Vercel:**

   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add the following variables:
     ```
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     FIREBASE_APP_ID=your_app_id
     NODE_ENV=production
     ```

4. **Configure Firebase Security Rules:**
   In your Firebase Console → Firestore → Rules, use:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /blogs/{blogId} {
         allow read: if true;
         allow write: if true; // You may want to add authentication here
       }
     }
   }
   ```

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Troubleshooting Vercel Issues

**Database not working on Vercel:**

1. Check environment variables are set correctly in Vercel dashboard
2. Verify Firebase project ID and configuration
3. Check Vercel function logs for errors
4. Ensure Firestore security rules allow read/write access

**CORS Issues:**

- The app includes CORS headers for cross-origin requests
- Ensure your Vercel domain is added to Firebase authorized domains

**File Upload Issues:**

- Vercel has a 10MB limit for serverless functions
- Consider using Firebase Storage for larger files

## Local Development vs Production

The app automatically detects the environment and configures itself accordingly:

- **Local**: Uses `.env` file for configuration
- **Vercel**: Uses Vercel environment variables

## Environment Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd .Blog-A-Blogging-Web-App
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   - Copy `.env.example` to `.env`
   - Update Firebase configuration in `.env`:
     ```
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=your_auth_domain
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     FIREBASE_APP_ID=your_app_id
     ```

4. **Firebase Setup**

   - Create a Firebase project
   - Enable Firestore Database
   - Add your domain to authorized domains
   - Update the configuration in `.env`

5. **Run the application**

   ```bash
   npm start
   ```

6. **Development mode**
   ```bash
   npm run dev
   ```

## File Upload Security

- Maximum file size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF, WebP
- Secure filename generation using UUIDs
- Path traversal protection

## Browser Support

- Modern browsers with ES6+ support
- Firebase 8.x compatibility
- Responsive design for mobile devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
