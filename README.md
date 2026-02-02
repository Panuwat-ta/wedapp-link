# Data Links - Modern Link & Note Management Platform

A modern, secure web application for organizing your digital resources with dark/light theme support, mobile-friendly design, and powerful management features.

![Version](https://img.shields.io/badge/version-6.01-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

## ✨ Features

### 🎨 Modern UI/UX
- **Dark/Light Theme Toggle** - Switch between themes with a single click
- **Grid/List View** - Choose your preferred viewing mode on the home page
- **Responsive Design** - Fully optimized for desktop, tablet, and mobile devices
- **Smooth Animations** - Professional transitions and hover effects
- **Modern Design System** - Consistent styling with CSS custom properties

### 🔐 User Management
- User registration and authentication
- Profile management with image upload
- Password reset functionality
- Secure session management

### 🔗 Link Management
- Add, edit, and delete links
- Search and filter functionality
- Category organization
- User-specific link collections
- Link statistics and analytics

### 📝 Note Management
- Create and edit notes
- Rich text editing
- Edit history tracking
- Note organization and search
- User-specific notes

### ☁️ Google Drive Integration
- Browse Google Drive files
- Upload files with drag-and-drop
- Download files and folders
- Folder navigation
- File type filtering

### 📱 Mobile Features
- Responsive navigation with hamburger menu
- Touch-friendly interface
- Mobile-optimized layouts
- Adaptive grid systems


## 📖 Usage

### Theme Toggle
- Click the floating button in the bottom-right corner to switch between dark and light themes
- Your preference is automatically saved

### Grid/List View (Home Page)
- Use the view toggle buttons to switch between card-based grid view and traditional list view
- Your preference is automatically saved

### Adding Links
1. Navigate to the "Update" page
2. Enter the URL and link name
3. Click "Add Link"

### Managing Notes
1. Go to "Add Note" to create a new note
2. View all notes in the "View Notes" page
3. Click on a note to view its edit history

### File Management
1. Sign in with Google on the "Upload" page
2. Drag and drop files or click to select
3. Choose destination folder
4. Upload to Google Drive

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **JSZip** - ZIP file creation

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom properties
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons
- **Google APIs** - Drive integration

## 📁 Project Structure

```
wedapp-link/
├── public/
│   ├── img/                    # Images and assets
│   ├── script/                 # Client-side JavaScript
│   │   ├── theme-manager.js    # Shared theme functionality
│   │   ├── script-index.js     # Home page logic
│   │   └── ...                 # Other page scripts
│   └── styles/                 # CSS files
│       ├── theme.css           # Global theme system
│       ├── styles-index.css    # Home page styles
│       └── ...                 # Other page styles
├── templates/                  # HTML templates
│   ├── index.html             # Home page
│   ├── login.html             # Login/Register
│   ├── date.html              # Update links
│   ├── files.html             # Browse files
│   ├── upload.html            # Upload files
│   ├── note.html              # View notes
│   ├── add-note.html          # Add note
│   ├── about.html             # About page
│   ├── logout.html            # Profile page
│   └── suport.html            # Support page
├── index.js                    # Main server file
├── package.json               # Dependencies
├── .env                       # Environment variables
└── README.md                  # This file
```

## 🎨 Theme System

The application includes a comprehensive theme system with:
- CSS custom properties for easy customization
- Dark and light theme variants
- Smooth transitions between themes
- Persistent theme preference
- Theme-aware components

### Customizing Themes

Edit `public/styles/theme.css` to customize colors:

```css
:root {
    --primary-color: #4285f4;
    --secondary-color: #34a853;
    /* ... more variables */
}

[data-theme="dark"] {
    --bg-primary: #0f1419;
    --text-primary: #e8eaed;
    /* ... more variables */
}
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🔒 Security Features

- Password hashing with bcryptjs
- Secure session management
- Input validation and sanitization
- HTTPS support (recommended for production)
- Environment variable protection

## 🐛 Bug Fixes (v2.0)

- Fixed mobile menu toggle functionality
- Resolved date parsing issues
- Fixed profile image loading with fallback
- Improved modal close functionality
- Fixed navigation link active states
- Resolved login/logout state synchronization
- Fixed search and filter functionality
- Improved error handling across all pages

## 🚀 Performance Optimizations

- Efficient data caching
- Optimized rendering
- Reduced API calls
- Lazy loading for images
- Debounced search input
- Minified assets (recommended for production)

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /reset-password` - Reset password

### Links
- `GET /data` - Get all links
- `POST /add-link` - Add new link
- `PUT /edit-link/:id` - Edit link
- `DELETE /delete-link/:id` - Delete link

### Notes
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### User
- `GET /current-user` - Get current user data
- `POST /update-profile` - Update user profile
- `POST /verify-password` - Verify password

### Files
- `GET /api/folders` - Get Google Drive folders
- `POST /api/folders` - Create folder
- `POST /start-upload` - Start file upload
- `GET /upload-progress/:uploadId` - Get upload progress

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.



## 🙏 Acknowledgments

- Font Awesome for icons
- Google for Drive API
- MongoDB for database
- Express.js community


**Version**: 4.0  
**Last Updated**: February 2026  
**Status**: Active Development

