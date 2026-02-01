# 📊 Data Links - Project Overview

## 🎯 โปรเจคนี้คืออะไร?

**Data Links** คือแพลตฟอร์มสมัยใหม่สำหรับจัดการ Links และ Notes ของคุณ พร้อมระบบ Dark/Light Theme, การแสดงผลแบบ Grid/List View, และรองรับการใช้งานบนมือถืออย่างเต็มรูปแบบ

## 🌟 ฟีเจอร์หลัก

### 1. 🔗 Link Management
- เพิ่ม, แก้ไข, ลบ Links
- ค้นหาและกรอง Links
- แสดงผลแบบ Grid หรือ List
- แสดงรูปโปรไฟล์ผู้สร้าง

### 2. 📝 Note Management
- สร้างและแก้ไข Notes
- Rich Text Editing
- Edit History Tracking
- จัดการ Notes ส่วนตัว

### 3. ☁️ Google Drive Integration
- Browse ไฟล์จาก Google Drive
- Upload ไฟล์ด้วย Drag & Drop
- Download ไฟล์และโฟลเดอร์
- จัดการโฟลเดอร์

### 4. 👤 User Management
- ลงทะเบียนและ Login
- จัดการโปรไฟล์
- Upload รูปโปรไฟล์
- Reset Password

### 5. 🎨 Theme System
- Dark Theme (Default)
- Light Theme
- Toggle ใน Navbar
- บันทึกอัตโนมัติ

### 6. 📱 Responsive Design
- Desktop Optimized
- Tablet Friendly
- Mobile Responsive
- Touch-friendly Interface

## 🏗️ โครงสร้างโปรเจค

```
data-links/
├── public/
│   ├── img/                    # รูปภาพและ Assets
│   ├── script/                 # JavaScript Files
│   │   ├── theme-manager.js    # Theme Management (Shared)
│   │   ├── script-index.js     # Home Page Logic
│   │   ├── script-login.js     # Login/Register Logic
│   │   ├── script-data.js      # Update Links Logic
│   │   ├── script-files.js     # Files Browser Logic
│   │   ├── script-upload.js    # Upload Logic
│   │   ├── script-note.js      # Notes Viewer Logic
│   │   ├── script-add-note.js  # Add Note Logic
│   │   ├── script-about.js     # About Page Logic
│   │   ├── script-logout.js    # Profile Logic
│   │   └── script-suport.js    # Support Page Logic
│   └── styles/                 # CSS Files
│       ├── theme.css           # Global Theme System
│       ├── navbar.css          # Shared Navbar Styles
│       ├── styles-index.css    # Home Page Styles
│       ├── styles-login.css    # Login Page Styles
│       ├── styles-data.css     # Update Page Styles
│       ├── styles-files.css    # Files Page Styles
│       ├── styles-upload.css   # Upload Page Styles
│       ├── styles-note.css     # Notes Page Styles
│       ├── styles-add-note.css # Add Note Page Styles
│       ├── styles-about.css    # About Page Styles
│       ├── styles-logout.css   # Profile Page Styles
│       └── styles-suport.css   # Support Page Styles
├── templates/                  # HTML Templates
│   ├── index.html             # Home Page
│   ├── login.html             # Login/Register Page
│   ├── date.html              # Update Links Page
│   ├── files.html             # Files Browser Page
│   ├── upload.html            # Upload Page
│   ├── note.html              # Notes Viewer Page
│   ├── add-note.html          # Add Note Page
│   ├── about.html             # About Page
│   ├── logout.html            # Profile Page
│   └── suport.html            # Support Page
├── index.js                    # Main Server File
├── package.json               # Dependencies
├── .env                       # Environment Variables
├── vercel.json                # Vercel Configuration
└── README.md                  # Project Documentation
```

## 🎨 Design System

### Colors
- **Primary**: #4285f4 (Blue)
- **Secondary**: #34a853 (Green)
- **Accent**: #ea4335 (Red)
- **Warning**: #fbbc04 (Yellow)

### Dark Theme
- **Background**: #0f1419
- **Surface**: #1a2332
- **Text**: #e8eaed

### Light Theme
- **Background**: #f5f7fa
- **Surface**: #ffffff
- **Text**: #1a1a1a

### Typography
- **Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Sizes**: 0.85rem - 2.5rem
- **Weights**: 400, 500, 600, 700

### Spacing
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **2XL**: 48px

### Border Radius
- **SM**: 4px
- **MD**: 8px
- **LG**: 12px
- **XL**: 16px
- **Full**: 9999px

## 🔧 Technology Stack

### Backend
- **Node.js** v14+
- **Express.js** v4.21+
- **MongoDB** v6.12+
- **bcryptjs** v2.4+
- **Multer** v1.4+
- **JSZip** v3.10+

### Frontend
- **HTML5**
- **CSS3** (Custom Properties, Flexbox, Grid)
- **JavaScript** (ES6+)
- **Font Awesome** v6.4+
- **Google APIs** (Drive, OAuth)

### Tools
- **Git** (Version Control)
- **npm** (Package Manager)
- **Vercel** (Deployment)

## 📱 Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Browsers (iOS Safari, Chrome Mobile)

## 🚀 Performance

- ⚡ Fast Page Load (< 2s)
- 🎯 Smooth Animations (60fps)
- 💾 Efficient Caching
- 📉 Optimized Assets
- 🔄 Smart Data Fetching

## 🔒 Security

- 🔐 Password Hashing (bcryptjs)
- 🛡️ Input Validation
- 🔑 Secure Sessions
- 🌐 HTTPS Support
- 🚫 XSS Protection

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Links Collection
```javascript
{
  _id: ObjectId,
  url: String,
  name: String,
  date: String,
  username: String
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  noteName: String,
  content: String,
  username: String,
  createdAt: Date,
  lastEditedBy: String,
  lastEditedAt: Date,
  editHistory: Array
}
```

## 🎯 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /reset-password` - Reset password
- `POST /verify-password` - Verify password

### Links
- `GET /data` - Get all links
- `POST /add-link` - Add new link
- `PUT /edit-link/:id` - Edit link
- `DELETE /delete-link/:id` - Delete link
- `GET /user-links-count` - Count user links

### Notes
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### User
- `GET /current-user` - Get current user data
- `POST /update-profile` - Update user profile
- `GET /check-username` - Check username availability
- `GET /check-email` - Check email availability

### Files
- `GET /api/folders` - Get Google Drive folders
- `POST /api/folders` - Create folder
- `POST /start-upload` - Start file upload
- `GET /upload-progress/:uploadId` - Get upload progress
- `POST /cancel-upload/:uploadId` - Cancel upload
- `GET /download-folder/:folderId` - Download folder as ZIP

### Analytics
- `GET /daily-visitors` - Get daily visitor count
- `POST /IP` - Log visitor IP

## 📈 Future Roadmap

### Phase 1 (Current) ✅
- ✅ Basic Link Management
- ✅ Note Management
- ✅ User Authentication
- ✅ Google Drive Integration
- ✅ Dark/Light Theme
- ✅ Responsive Design
- ✅ Grid/List View

### Phase 2 (Planned)
- [ ] PWA Support
- [ ] Offline Mode
- [ ] Real-time Collaboration
- [ ] Advanced Search
- [ ] Tags and Categories
- [ ] Export/Import Data

### Phase 3 (Future)
- [ ] Multi-language Support
- [ ] Advanced Analytics
- [ ] API Documentation
- [ ] Mobile Apps
- [ ] Browser Extensions
- [ ] Integrations (Notion, Trello, etc.)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Panuwat Takham**
- Email: panuwattakham2002@gmail.com
- Facebook: [Panuwat Takham](https://web.facebook.com/panuwat.takham.b/)
- Instagram: [@panuwat.z](https://www.instagram.com/panuwat.z/)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google for Drive API
- MongoDB for database
- Express.js community
- All contributors

## 📞 Support

If you find this project helpful, consider supporting the developer through the Support page in the application.

---

**Version**: 2.0  
**Last Updated**: February 2026  
**Status**: ✅ Active Development

---

Made with ❤️ by Panuwat Takham
