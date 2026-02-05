require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // Replace bcrypt with bcryptjs
const JSZip = require('jszip');
const https = require('https');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const upload = multer();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to minify CSS and JS files
app.use(async (req, res, next) => {
  const filePath = path.join(__dirname, 'public', req.path);
  
  // Check if file is CSS or JS
  if (req.path.endsWith('.css') || req.path.endsWith('.js')) {
    try {
      // Check if file exists
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (req.path.endsWith('.css')) {
          // Minify CSS
          const output = new CleanCSS({
            level: 2,
            compatibility: 'ie9'
          }).minify(content);
          
          res.setHeader('Content-Type', 'text/css');
          res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
          return res.send(output.styles);
        } else if (req.path.endsWith('.js')) {
          // Minify JS
          const result = await minifyJS(content, {
            compress: {
              dead_code: true,
              drop_console: false,
              drop_debugger: true,
              keep_classnames: true,
              keep_fnames: true
            },
            mangle: false, // Don't mangle names to keep code readable
            format: {
              comments: false
            }
          });
          
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
          return res.send(result.code);
        }
      }
    } catch (error) {
      console.error(`Error minifying ${req.path}:`, error);
      // If minification fails, serve original file
    }
  }
  
  next();
});

// Serve static files with smart caching
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Cache images for 7 days (rarely change)
    if (filePath.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
    // CSS/JS caching is handled by minify middleware above
  }
}));

// MongoDB URI and Client
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Error: MONGODB_URI is not defined in environment variables.");
  process.exit(1); // Exit if MONGODB_URI is missing
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
}
connectToMongoDB();

// Middleware for parsing JSON
app.use(express.json());

// Route สำหรับหน้า Home
app.get('/', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store'); // หลีกเลี่ยงการแคชไฟล์ HTML
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับไฟล์ date.html
app.get('/date.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'date.html'));
});

// Route สำหรับไฟล์ profile.html
app.get('/about.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'about.html'));
});

// Route สำหรับไฟล์ index.html
app.get('/index.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับไฟล์ login.html
app.get('/login.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

// Route สำหรับไฟล์ upload.html
app.get('/upload.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'upload.html'));
});

// Route สำหรับไฟล์ files.html
app.get('/files.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'files.html'));
});

// Route สำหรับไฟล์ suport.html
app.get('/suport.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'suport.html'));
});

// Route สำหรับไฟล์ logout.html
app.get('/logout.html', (req, res) => {
  //res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'logout.html'));
});

// Route สำหรับไฟล์ note.html
app.get('/note.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'note.html'));
});

// Route สำหรับไฟล์ add-note.html
app.get('/add-note.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'add-note.html'));
});

// API endpoint for fetching notes
app.get('/api/notes', async (req, res) => {
  const { username } = req.query;

  try {
    const collection = client.db("Link").collection("notes");
    
    // If username is provided, filter by username
    // Otherwise, return all notes
    const query = username ? { username } : {};
    
    const notes = await collection.find(query).sort({ createdAt: -1 }).toArray();
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).send("Error fetching notes");
  }
});

// API endpoint for saving a new note
app.post('/api/notes', async (req, res) => {
  console.log('--- NEW NOTE REQUEST ---');
  console.log('Request Body:', req.body);
  const { content, noteName } = req.body;
  const username = req.headers['x-username'];

  if (!content || !username || !noteName) {
    return res.status(400).send('Content, note name, and username are required');
  }

  try {
    const collection = client.db("Link").collection("notes");
    const result = await collection.insertOne({
      noteName: String(noteName), // Ensure noteName is a string
      content: String(content), // Ensure content is a string
      username: String(username), // Ensure username is a string
      createdAt: new Date(),
      lastEditedBy: username,
      lastEditedAt: new Date(),
      editHistory: [] // Initialize empty edit history array
    });
    const newNote = await collection.findOne({ _id: result.insertedId });
    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error saving note:", error);
    res.status(500).send("Error saving note");
  }
});

// API endpoint for deleting a note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send('Invalid note ID');
  }

  try {
    const collection = client.db("Link").collection("notes");
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send('Note not found');
    }

    res.status(200).send('Note deleted successfully');
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send("Error deleting note");
  }
});

// API endpoint for fetching a single note by ID
app.get('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send('Invalid note ID');
  }

  try {
    const collection = client.db("Link").collection("notes");
    const note = await collection.findOne({ _id: new ObjectId(id) });

    if (!note) {
      return res.status(404).send('Note not found');
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).send("Error fetching note");
  }
});

// API endpoint for updating a note
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { content, noteName } = req.body;
  const username = req.headers['x-username'];

  if (!ObjectId.isValid(id)) {
    return res.status(400).send('Invalid note ID');
  }

  if (!content || !noteName) {
    return res.status(400).send('Content and note name are required');
  }

  try {
    const collection = client.db("Link").collection("notes");
    
    // Get the current note to save as history
    const currentNote = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!currentNote) {
      return res.status(404).send('Note not found');
    }

    // Only save to history if content actually changed
    if (currentNote.content !== content || currentNote.noteName !== noteName) {
      // Create history entry with the current state before updating
      const historyEntry = {
        content: currentNote.content,
        noteName: currentNote.noteName,
        editedBy: currentNote.lastEditedBy || currentNote.username, // Last editor or original creator
        editedAt: currentNote.lastEditedAt || currentNote.createdAt || currentNote.updatedAt,
        editType: currentNote.editHistory && currentNote.editHistory.length > 0 ? 'modified' : 'original'
      };

      // Update the note with new content and add current state to history
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            content, 
            noteName, 
            updatedAt: new Date(),
            lastEditedBy: username,
            lastEditedAt: new Date()
          },
          $push: { 
            editHistory: historyEntry
          }
        }
      );
    } else {
      // No changes made, just update the last edited info
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            lastEditedBy: username,
            lastEditedAt: new Date()
          }
        }
      );
    }

    res.status(200).send('Note updated successfully');
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).send("Error updating note");
  }
});

// Route สำหรับส่งข้อมูล MongoDB
app.get('/data', async (req, res) => {
  try {
    const collection = client.db("Link").collection("link");
    const data = await collection.aggregate([
      {
        $lookup: {
          from: "User",
          localField: "username",
          foreignField: "username",
          as: "user"
        }
      },
      {
        $addFields: {
          profileImage: { $arrayElemAt: ["$user.profileImage", 0] }
        }
      },
      {
        $project: {
          user: 0
        }
      },

    ]).toArray();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

// Route สำหรับเพิ่มลิงก์ใหม่
app.post('/add-link', async (req, res) => {
  const { url, name, date } = req.body;
  if (!url || !name) {
    return res.status(400).send('URL และชื่อของลิงก์จำเป็นต้องมี');
  }

  try {
    // ดึง username จาก header
    const username = req.headers['x-username'];

    const collection = client.db("Link").collection("link");
    await collection.insertOne({
      url,
      name,
      date,
      username: username || 'Anonymous' // ถ้าไม่มี username ให้ใช้ 'Anonymous'
    });

    res.status(201).send('เพิ่มลิงก์สำเร็จ');
  } catch (error) {
    console.error("Error adding link:", error);
    res.status(500).send("Error adding link");
  }
});

// Route สำหรับนับจำนวนลิงก์ของผู้ใช้
app.get('/user-links-count', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const collection = client.db("Link").collection("link");
    const count = await collection.countDocuments({ username });
    res.json({ count });
  } catch (error) {
    console.error("Error counting user links:", error);
    res.status(500).json({ error: "Error counting user links" });
  }
});

// Route สำหรับแก้ไขลิงก์ (ทั้งชื่อและ URL)
app.put('/edit-link/:id', async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body;

  console.log('Received edit request:', { id, name, url }); // Log ข้อมูลที่ส่งมา

  // ตรวจสอบว่ามีข้อมูลที่จะแก้ไขหรือไม่
  if (!name && !url) {
    console.log('No data to update');
    return res.status(400).send('ต้องระบุชื่อหรือ URL ใหม่');
  }

  // ตรวจสอบ URL ถ้ามีการส่งมา
  if (url && !isValidUrl(url)) {
    console.log('Invalid URL:', url);
    return res.status(400).send('URL ไม่ถูกต้อง');
  }

  try {
    const collection = client.db("Link").collection("link");

    // ตรวจสอบว่า id ถูกต้องหรือไม่
    if (!ObjectId.isValid(id)) {
      console.log('Invalid ObjectId:', id);
      return res.status(400).send('ID ไม่ถูกต้อง');
    }

    // สร้าง object สำหรับการอัปเดต
    const updateData = {};
    if (name) updateData.name = name;
    if (url) updateData.url = url;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).send('ไม่พบลิงก์ที่ต้องการแก้ไข');
    }

    if (result.modifiedCount === 0) {
      return res.status(400).send('ไม่มีการเปลี่ยนแปลงข้อมูล');
    }

    res.status(200).send('แก้ไขลิงก์สำเร็จ');
  } catch (error) {
    console.error("Error updating link:", error);
    res.status(500).send(`เกิดข้อผิดพลาดในการแก้ไขลิงก์: ${error.message}`);
  }
});

// ฟังก์ชันตรวจสอบ URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Route สำหรับลบลิงก์
app.delete('/delete-link/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collection = client.db("Link").collection("link");
    await collection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).send('ลบลิงก์สำเร็จ');
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).send("Error deleting link");
  }
});

// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  try {
    const usersCollection = client.db("Link").collection("User");

    // Check if username or email already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).send('Username already exists');
      }
      if (existingUser.email === email) {
        return res.status(400).send('Email already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password using bcryptjs
    await usersCollection.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
});

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Check if user exists endpoint
app.post('/check-user-exists', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  try {
    const usersCollection = client.db("Link").collection("User");

    // Check if username or email already exists (case-insensitive)
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (existingUser) {
      const usernameMatch = existingUser.username.toLowerCase() === username.toLowerCase();
      const emailMatch = existingUser.email.toLowerCase() === email.toLowerCase();
      
      if (usernameMatch && emailMatch) {
        return res.status(400).json({ message: 'Username and email already exist' });
      } else if (usernameMatch) {
        return res.status(400).json({ message: 'Username already exists. Please choose another username.' });
      } else if (emailMatch) {
        return res.status(400).json({ message: 'Email already registered. Please use another email or login.' });
      }
    }

    res.status(200).json({ message: 'Username and email are available' });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ message: 'Error checking user data' });
  }
});

// Generate random 6-character code (letters and numbers)
function generateVerificationCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Send verification code endpoint
app.post('/send-verification-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing in environment variables');
      return res.status(500).json({ message: 'Email service not configured' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration (3 minutes) using lowercase email
    const emailLower = email.toLowerCase();
    verificationCodes.set(emailLower, {
      code: code,
      expiresAt: Date.now() + 3 * 60 * 1000 // 3 minutes
    });

    console.log(`Generated verification code for ${emailLower}: ${code}`);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      return res.status(500).json({ message: 'Email service configuration error' });
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code - Data Links',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #4285f4, #34a853); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Data Links</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Thank you for registering! Please use the verification code below to complete your registration:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4285f4; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 3 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent successfully to ${emailLower}`);
    
    res.status(200).json({ 
      message: 'Verification code sent successfully',
      code: code // For development/testing only - remove in production
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    res.status(500).json({ 
      message: 'Failed to send verification code. Please try again.',
      error: error.message // For debugging - remove in production
    });
  }
});

// Verify code and register endpoint
app.post('/verify-and-register', upload.single('profileImage'), async (req, res) => {
  const { username, email, password, verificationCode, profileImageUrl } = req.body;
  const profileImage = req.file;

  if (!username || !email || !password || !verificationCode) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check verification code (case-insensitive email)
    const storedData = verificationCodes.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({ message: 'Verification code not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (storedData.code !== verificationCode.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Verification successful, proceed with registration
    const usersCollection = client.db("Link").collection("User");

    // Check if username or email already exists (case-insensitive)
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (existingUser) {
      verificationCodes.delete(email.toLowerCase());
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Prepare user data - store email in lowercase for consistency
    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerified: true,
      createdAt: new Date()
    };

    // Add profile image - priority: uploaded file > URL > default
    if (profileImage) {
      // Convert buffer to base64
      const base64Image = profileImage.buffer.toString('base64');
      userData.profileImage = `data:${profileImage.mimetype};base64,${base64Image}`;
    } else if (profileImageUrl) {
      // Use URL directly
      userData.profileImage = profileImageUrl;
    } else {
      // Use default image
      userData.profileImage = '/img/b1.jpg';
    }

    await usersCollection.insertOne(userData);

    // Remove verification code after successful registration
    verificationCodes.delete(email.toLowerCase());

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Error during verification and registration:", error);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Send reset code endpoint
app.post('/send-reset-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if email exists in database (case-insensitive)
    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate reset code
    const code = generateVerificationCode();
    
    // Store code with expiration (3 minutes) using lowercase email
    const emailLower = email.toLowerCase();
    verificationCodes.set(`reset_${emailLower}`, {
      code: code,
      expiresAt: Date.now() + 3 * 60 * 1000 // 3 minutes
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code - Data Links',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #4285f4, #34a853); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Data Links</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Password Reset</h2>
            <p style="color: #666; font-size: 16px;">You requested to reset your password. Please use the code below:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4285f4; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 3 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Reset code sent successfully' });
  } catch (error) {
    console.error('Error sending reset code:', error);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
});

// Verify reset code endpoint
app.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    // Check verification code using lowercase email
    const emailLower = email.toLowerCase();
    const storedData = verificationCodes.get(`reset_${emailLower}`);
    
    if (!storedData) {
      return res.status(400).json({ message: 'Reset code not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`reset_${emailLower}`);
      return res.status(400).json({ message: 'Reset code expired' });
    }

    if (storedData.code !== code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Code is valid, mark it as verified (don't delete yet, need it for password reset)
    verificationCodes.set(`reset_${emailLower}`, {
      ...storedData,
      verified: true
    });

    res.status(200).json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    res.status(500).json({ message: 'Error verifying code' });
  }
});

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    // Check if code was verified using lowercase email
    const emailLower = email.toLowerCase();
    const storedData = verificationCodes.get(`reset_${emailLower}`);
    
    if (!storedData || !storedData.verified) {
      return res.status(400).json({ message: 'Please verify reset code first' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`reset_${emailLower}`);
      return res.status(400).json({ message: 'Reset session expired' });
    }

    // Update password (case-insensitive email search)
    const usersCollection = client.db("Link").collection("User");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await usersCollection.updateOne(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove verification code after successful password reset
    verificationCodes.delete(`reset_${emailLower}`);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const usersCollection = client.db("Link").collection("User");
    
    // Case-insensitive email search using regex
    const user = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password); // Compare password using bcryptjs
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// User logout endpoint
app.post('/logout', (req, res) => {
  try {
    res.status(200).send('Logout successful');
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).send('Error during logout');
  }
});

// Serve environment variables to the frontend
app.get('/env', (req, res) => {
  res.json({
    API_KEY: process.env.API_KEY,
    CLIENT_ID: process.env.CLIENT_ID,
    FOLDER_ID: process.env.FOLDER_ID,
  });
});

// Route to fetch the current user's data
app.get('/current-user', async (req, res) => {
  try {
    const email = req.headers['x-email']; // รับ email จาก header
    if (!email) {
      return res.status(400).json({ error: 'กรุณาส่ง email ใน header' });
    }

    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ในฐานข้อมูล' });
    }

    // ส่งข้อมูล username, email และ profileImage กลับไปยัง client
    res.status(200).json({
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || '/img/b1.jpg' // ส่งรูปเริ่มต้นถ้าไม่มี profileImage
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// Route for checking user credentials for password reset
app.post('/check-reset-credentials', async (req, res) => {
  const { username, email } = req.body;
  try {
    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ username, email });

    if (user) {
      res.status(200).json({ valid: true });
    } else {
      res.status(404).json({ valid: false, message: 'User not found' });
    }
  } catch (error) {
    console.error("Error checking credentials:", error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Route for resetting password
app.post('/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;
  try {
    const usersCollection = client.db("Link").collection("User");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await usersCollection.updateOne(
      { username, email },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Password reset successful' });
    } else {
      res.status(400).json({ message: 'Password reset failed' });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route สำหรับตรวจสอบรหัสผ่าน
app.post('/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const username = req.headers['x-username'];

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Password verified' });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Error verifying password' });
  }
});


// Route สำหรับตรวจสอบ username (case insensitive)
app.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ available: false });
    }

    const usersCollection = client.db("Link").collection("User");
    // ใช้ regex เพื่อตรวจสอบแบบไม่สนใจตัวพิมพ์เล็กใหญ่
    const existingUser = await usersCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    // ถ้าไม่พบผู้ใช้หรือเป็นผู้ใช้ปัจจุบัน ให้ถือว่าว่าง
    const currentUsername = req.headers['x-username'];
    if (!existingUser || (currentUsername && existingUser.username.toLowerCase() === currentUsername.toLowerCase())) {
      return res.json({ available: true });
    }

    res.json({ available: false });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ available: false });
  }
});

// Route สำหรับตรวจสอบ email
app.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ available: false });
    }

    const usersCollection = client.db("Link").collection("User");
    // ใช้ regex เพื่อตรวจสอบแบบไม่สนใจตัวพิมพ์เล็กใหญ่
    const existingUser = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    // ถ้าไม่พบผู้ใช้หรือเป็นผู้ใช้ปัจจุบัน ให้ถือว่าว่าง
    const currentUsername = req.headers['x-username'];
    if (!existingUser || (currentUsername && existingUser.username.toLowerCase() === currentUsername.toLowerCase())) {
      return res.json({ available: true });
    }

    res.json({ available: false });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ available: false });
  }
});

// Route สำหรับอัปเดตโปรไฟล์ผู้ใช้
app.post('/update-profile', async (req, res) => {
  try {
    const { username, email, profileImage } = req.body;
    const currentUsername = req.headers['x-username'];

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const usersCollection = client.db("Link").collection("User");

    // Check if username already exists (excluding current user)
    if (username !== currentUsername) {
      const existingUser = await usersCollection.findOne({
        username: username
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Update user profile including links collection
    const userUpdateResult = await usersCollection.updateOne(
      { username: currentUsername },
      {
        $set: {
          username: username,
          email: email,
          profileImage: profileImage || null,
          updatedAt: new Date()
        }
      }
    );

    // Update username in links collection
    const linksCollection = client.db("Link").collection("link");
    await linksCollection.updateMany(
      { username: currentUsername },
      { $set: { username: username } }
    );

    if (userUpdateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      username: username,
      email: email,
      profileImage: profileImage
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Helper function to get user IP
function getUserIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
  console.log(`Extracted IP: ${ip || 'No IP found'}`); //เพื่อตรวจสอบ IP ที่ดึงมา
  return ip;
}

// Helper function to get current timestamp in Thailand timezone with 24-hour format
function getThailandTimestamp() {
  const options = {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  return new Date().toLocaleString("en-GB", options); // ใช้ en-GB เพื่อให้ได้รูปแบบวัน/เดือน/ปี
}

// Helper function to get today's date in Thailand timezone
function getTodayDateThailand() {
  const options = {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  };
  return new Date().toLocaleDateString("en-GB", options); // ใช้ en-GB เพื่อให้ได้รูปแบบวัน/เดือน/ปี
}

// Route สำหรับแสดงจำนวนผู้เข้าใช้งานวันนี้
app.get('/daily-visitors', async (req, res) => {
  try {
    const today = getTodayDateThailand(); // วันที่ปัจจุบันในเขตเวลาไทย
    const collection = client.db("Link").collection("IP");
    const visitors = await collection.countDocuments({
      timestamp: { $regex: `^${today}` } // ค้นหา timestamp ที่ขึ้นต้นด้วยวันที่ปัจจุบัน
    });
    res.json({ date: today, visitors });
  } catch (error) {
    console.error("Error fetching daily visitors:", error.message);
    res.status(500).send("Error fetching daily visitors");
  }
});

// Route สำหรับบันทึก IP
app.post('/IP', async (req, res) => {
  const userIP = getUserIP(req); // ใช้ helper function เพื่อดึง IP
  if (!userIP) {
    console.error('Unable to retrieve IP');
    return res.status(400).send('Unable to retrieve IP');
  }
  try {
    const collection = client.db("Link").collection("IP");
    const result = await collection.updateOne(
      { IP: userIP }, // ค้นหา IP ที่ซ้ำ
      { $set: { timestamp: getThailandTimestamp() } }, // อัปเดต timestamp เป็นเวลาประเทศไทย
      { upsert: true } // หากไม่มี IP ให้เพิ่มใหม่
    );
    console.log(`IP processed: ${JSON.stringify(result)}`); //เพื่อตรวจสอบผลลัพธ์
    res.status(200).send('IP processed successfully');
  } catch (error) {
    console.error("Error processing IP:", error.message); //ข้อความ error
    res.status(500).send("Error processing IP");
  }
});

// Middleware to log and store user IP
app.use(async (req, res, next) => {
  const userIP = getUserIP(req); // ใช้ helper function เพื่อดึง IP
  if (userIP) {
    try {
      const collection = client.db("Link").collection("IP");
      const result = await collection.updateOne(
        { IP: userIP }, // ค้นหา IP ที่ซ้ำ
        { $set: { timestamp: getThailandTimestamp() } }, // อัปเดต timestamp เป็นเวลาประเทศไทย
        { upsert: true } // หากไม่มี IP ให้เพิ่มใหม่
      );
      console.log(`Logged IP to database: ${JSON.stringify(result)}`); //เพื่อตรวจสอบผลลัพธ์การบันทึก
    } catch (error) {
      console.error("Error logging IP:", error.message); //ข้อความ error
    }
  } else {
    console.error('Unable to retrieve IP for logging'); //กรณีไม่สามารถดึง IP ได้
  }
  next();
});

// Route สำหรับดาวน์โหลดโฟลเดอร์เป็น ZIP
app.get('/download-folder/:folderId', async (req, res) => {
  const { folderId } = req.params;
  const apiKey = process.env.API_KEY;

  try {
    // ดึงข้อมูลโฟลเดอร์เพื่อใช้ชื่อ
    const folderUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name&key=${apiKey}`;
    const folderResponse = await fetch(folderUrl);
    if (!folderResponse.ok) {
      throw new Error('Failed to fetch folder information');
    }
    const folderData = await folderResponse.json();
    const folderName = folderData.name;

    const zip = new JSZip();
    let fileIndex = 1;

    // ฟังก์ชันสำหรับสร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    function getUniqueFileName(fileName, path) {
      const ext = fileName.lastIndexOf('.') > -1 ? fileName.substring(fileName.lastIndexOf('.')) : '';
      const baseName = fileName.lastIndexOf('.') > -1 ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const fullPath = `${path}${fileName}`;

      if (!zip.files[fullPath]) {
        return fileName;
      }

      return `${baseName} (${fileIndex++})${ext}`;
    }

    // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
    async function downloadFile(fileId, fileName, mimeType, path) {
      return new Promise(async (resolve, reject) => {
        try {
          if (mimeType.includes('application/vnd.google-apps')) {
            // สำหรับไฟล์ Google Docs/Sheets/Slides
            let exportMimeType;
            let exportExtension;

            switch (mimeType) {
              case 'application/vnd.google-apps.document':
                exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                exportExtension = '.docx';
                break;
              case 'application/vnd.google-apps.spreadsheet':
                exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                exportExtension = '.xlsx';
                break;
              case 'application/vnd.google-apps.presentation':
                exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                exportExtension = '.pptx';
                break;
              default:
                return resolve(null);
            }

            const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMimeType}&key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
              console.warn(`Failed to export file ${fileName}: ${response.statusText}`);
              return resolve(null);
            }
            const buffer = await response.arrayBuffer();
            const uniqueName = getUniqueFileName(fileName + exportExtension, path);
            resolve({
              content: Buffer.from(buffer),
              name: uniqueName
            });
          } else {
            // สำหรับไฟล์ปกติ
            const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
            https.get(url, response => {
              if (response.statusCode !== 200) {
                console.warn(`Failed to download file ${fileName}: ${response.statusMessage}`);
                return resolve(null);
              }
              const chunks = [];
              response.on('data', chunk => chunks.push(chunk));
              response.on('end', () => {
                const uniqueName = getUniqueFileName(fileName, path);
                resolve({
                  content: Buffer.concat(chunks),
                  name: uniqueName
                });
              });
              response.on('error', error => {
                console.warn(`Error downloading file ${fileName}:`, error);
                resolve(null);
              });
            }).on('error', error => {
              console.warn(`Connection error for file ${fileName}:`, error);
              resolve(null);
            });
          }
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
          resolve(null);
        }
      });
    }

    // ฟังก์ชันสำหรับดึงไฟล์ทั้งหมดในโฟลเดอร์
    async function getAllFilesInFolder(folderId, path = '') {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch folder contents: ${response.statusText}`);
        }
        const data = await response.json();

        // เรียงไฟล์ตามขนาดจากเล็กไปใหญ่เพื่อจัดการหน่วยความจำ
        const sortedFiles = (data.files || []).sort((a, b) => (a.size || 0) - (b.size || 0));

        for (const file of sortedFiles) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            // สร้างโฟลเดอร์ย่อยและดาวน์โหลดไฟล์ภายใน
            const folderName = getUniqueFileName(file.name, path);
            const newPath = `${path}${folderName}/`;
            zip.folder(folderName);
            await getAllFilesInFolder(file.id, newPath);
          } else {
            // ดาวน์โหลดไฟล์
            const fileData = await downloadFile(file.id, file.name, file.mimeType, path);
            if (fileData) {
              zip.file(`${path}${fileData.name}`, fileData.content);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing folder ${path}:`, error);
      }
    }

    await getAllFilesInFolder(folderId);

    // ตรวจสอบว่ามีไฟล์ในโฟลเดอร์หรือไม่
    if (Object.keys(zip.files).length === 0) {
      return res.status(404).send('No files found in folder or all files failed to download');
    }

    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 5 }
    });

    // ใช้ชื่อโฟลเดอร์ในการตั้งชื่อไฟล์ ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    res.send(zipContent);

  } catch (error) {
    console.error('Error creating zip:', error);
    res.status(500).send('Error creating zip file');
  }
});

// Store active downloads
const activeDownloads = new Map();

// Route to start folder download
app.post('/start-folder-download', async (req, res) => {
  const { folderId, folderName } = req.body;
  const downloadId = Date.now().toString();

  activeDownloads.set(downloadId, {
    folderId,
    folderName,
    progress: 0,
    status: 'preparing',
    isCancelled: false
  });

  // Start processing in background
  processDownload(downloadId).catch(console.error);
  res.json({ downloadId });
});

// Route to get download progress
app.get('/download-progress/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.json({ error: 'Download not found or expired' });
  }

  if (download.isCancelled) {
    activeDownloads.delete(downloadId);
    return res.json({ error: 'Download cancelled' });
  }

  res.json({
    progress: download.progress,
    status: download.status,
    completed: download.status === 'completed',
    downloadUrl: download.downloadUrl,
    timestamp: download.timestamp
  });
});

// Route to cancel download
app.post('/cancel-download/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (download) {
    download.isCancelled = true;
  }

  res.sendStatus(200);
});

// Process download in background
async function processDownload(downloadId) {
  const download = activeDownloads.get(downloadId);
  if (!download || download.isCancelled) return;

  try {
    const apiKey = process.env.API_KEY;
    const zip = new JSZip();
    let processedFiles = 0;
    let totalFiles = 0;
    const fileNameCounter = new Map(); // Track duplicate filenames

    // Helper function to get unique filename
    function getUniqueFileName(originalName, path) {
      const fullPath = path + originalName;
      if (!fileNameCounter.has(fullPath)) {
        fileNameCounter.set(fullPath, 1);
        return originalName;
      }

      const count = fileNameCounter.get(fullPath);
      fileNameCounter.set(fullPath, count + 1);

      const ext = originalName.lastIndexOf('.') > -1 ?
        originalName.substring(originalName.lastIndexOf('.')) : '';
      const baseName = originalName.lastIndexOf('.') > -1 ?
        originalName.substring(0, originalName.lastIndexOf('.')) : originalName;

      return `${baseName} (${count})${ext}`;
    }

    // Helper function to count total files in a folder
    async function countFiles(folderId) {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,mimeType)&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch folder contents');
        const data = await response.json();

        let count = data.files.length;
        for (const file of data.files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            count += await countFiles(file.id);
          }
        }
        return count;
      } catch (error) {
        console.error('Error counting files:', error);
        return 0;
      }
    }

    // Count total files first
    totalFiles = await countFiles(download.folderId);
    if (totalFiles === 0) {
      throw new Error('No files found in folder');
    }

    // Update status to downloading
    download.status = 'downloading';
    download.totalFiles = totalFiles;

    // Use existing getAllFilesInFolder function but modified for progress tracking
    async function processFolder(folderId, path = '') {
      if (download.isCancelled) return;

      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType)&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch folder contents');
        const data = await response.json();

        for (const file of data.files) {
          if (download.isCancelled) return;

          if (file.mimeType === 'application/vnd.google-apps.folder') {
            const uniqueFolderName = getUniqueFileName(file.name, path);
            const folderPath = path + uniqueFolderName + '/';
            zip.folder(uniqueFolderName);
            await processFolder(file.id, folderPath);
          } else {
            const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${apiKey}`);
            if (fileResponse.ok) {
              const content = await fileResponse.arrayBuffer();
              const uniqueFileName = getUniqueFileName(file.name, path);
              zip.file(path + uniqueFileName, content);
            }
            processedFiles++;
            download.progress = Math.round((processedFiles / totalFiles) * 100);
          }
        }
      } catch (error) {
        console.error('Error processing folder:', error);
        throw error;
      }
    }

    await processFolder(download.folderId);

    if (download.isCancelled) {
      activeDownloads.delete(downloadId);
      return;
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 5 }
    });

    download.zipBuffer = zipBuffer;
    download.status = 'completed';
    download.progress = 100;
    download.downloadUrl = `/download-zip/${downloadId}`;

    // Clean up after 5 minutes
    setTimeout(() => {
      activeDownloads.delete(downloadId);
    }, 300000);

  } catch (error) {
    console.error('Download processing error:', error);
    download.status = 'error';
    download.error = error.message;
    activeDownloads.delete(downloadId);
  }
}

// Route to serve the completed zip file
app.get('/download-zip/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download || !download.zipBuffer) {
    return res.status(404).send('Download not found or expired');
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${download.folderName}.zip"`);
  res.send(download.zipBuffer);
});

// Route สำหรับดึงข้อมูลโฟลเดอร์จาก Google Drive
app.get('/api/folders', async (req, res) => {
  const { parentId } = req.query;
  const apiKey = process.env.API_KEY;

  if (!parentId) {
    return res.status(400).json({ error: 'Parent folder ID is required' });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data.files || []);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Route สำหรับสร้างโฟลเดอร์ใหม่
app.post('/api/folders', async (req, res) => {
  const { name, parentId } = req.body;
  const apiKey = process.env.API_KEY;

  if (!name || !parentId) {
    return res.status(400).json({ error: 'Folder name and parent ID are required' });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`,
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Store active uploads
const activeUploads = new Map();

// Route to start upload
app.post('/start-upload', upload.array('files'), async (req, res) => {
  if (!req.files || !req.body.folderId) {
    return res.status(400).json({ error: 'Missing files or folder ID' });
  }

  const files = req.files;
  const { folderId } = req.body;
  const uploadId = Date.now().toString();
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  activeUploads.set(uploadId, {
    files: files.map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      buffer: f.buffer,
      progress: 0,
      status: 'pending'
    })),
    folderId,
    accessToken,
    progress: 0,
    status: 'preparing',
    isCancelled: false
  });

  processUpload(uploadId).catch(console.error);
  res.json({ uploadId });
});

// Route to get upload progress
app.get('/upload-progress/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const upload = activeUploads.get(uploadId);

  if (!upload) {
    return res.json({ error: 'Upload not found' });
  }

  if (upload.isCancelled) {
    activeUploads.delete(uploadId);
    return res.json({ error: 'Upload cancelled' });
  }

  res.json({
    progress: upload.progress,
    status: upload.status,
    completed: upload.status === 'completed',
    files: upload.files
  });
});

// Process upload in background
async function processUpload(uploadId) {
  const upload = activeUploads.get(uploadId);
  if (!upload || upload.isCancelled) return;

  try {
    upload.status = 'uploading';
    let totalProgress = 0;

    for (const file of upload.files) {
      if (upload.isCancelled) {
        console.log('Upload cancelled, stopping process');
        upload.status = 'cancelled';
        activeUploads.delete(uploadId);
        return;
      }

      file.status = 'uploading';
      try {
        const metadata = {
          name: file.name,
          mimeType: file.type,
          parents: [upload.folderId]
        };

        const controller = new AbortController();
        const signal = controller.signal;

        // Store controller for cancellation
        file.controller = controller;

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([file.buffer], { type: file.type }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${upload.accessToken}`
          },
          body: form,
          signal
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        file.status = 'completed';
        file.progress = 100;
        delete file.buffer;
        delete file.controller;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`Upload of ${file.name} was cancelled`);
          file.status = 'cancelled';
        } else {
          console.error(`Error uploading file ${file.name}:`, error);
          file.status = 'error';
          file.error = error.message;
        }
      }

      if (!upload.isCancelled) {
        totalProgress = upload.files.reduce((sum, f) => sum + (f.progress || 0), 0);
        upload.progress = Math.round(totalProgress / upload.files.length);
      }
    }

    if (upload.isCancelled) {
      upload.status = 'cancelled';
      activeUploads.delete(uploadId);
    } else {
      upload.status = upload.files.some(f => f.status === 'error') ? 'completed with errors' : 'completed';
      setTimeout(() => {
        activeUploads.delete(uploadId);
      }, 300000);
    }

  } catch (error) {
    console.error('Upload processing error:', error);
    upload.status = 'error';
    upload.error = error.message;
    activeUploads.delete(uploadId);
  }
}

// Send delete account verification code endpoint
app.post('/send-delete-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if email exists in database
    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration (3 minutes)
    verificationCodes.set(`delete_${email}`, {
      code: code,
      expiresAt: Date.now() + 3 * 60 * 1000 // 3 minutes
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Account Deletion Verification - Data Links',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #d32f2f, #b71c1c); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Data Links</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #d32f2f;">⚠️ Account Deletion Verification</h2>
            <p style="color: #666; font-size: 16px;">You have requested to delete your account. This action cannot be undone.</p>
            <p style="color: #666; font-size: 16px;">Please use the verification code below to confirm account deletion:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #d32f2f; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 3 minutes.</p>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;"><strong>Warning:</strong> Once deleted, all your data including links and notes will be permanently removed.</p>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email and secure your account.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Verification code sent successfully', code: code });
  } catch (error) {
    console.error('Error sending delete verification code:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify and delete account endpoint
app.post('/verify-delete-account', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    // Check verification code
    const storedData = verificationCodes.get(`delete_${email}`);
    
    if (!storedData) {
      return res.status(400).json({ message: 'Verification code not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`delete_${email}`);
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (storedData.code !== code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Verification successful, proceed with account deletion
    const usersCollection = client.db("Link").collection("User");
    const linksCollection = client.db("Link").collection("link");
    const notesCollection = client.db("Link").collection("notes");

    // Find user to get username
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's links
    await linksCollection.deleteMany({ username: user.username });

    // Delete user's notes
    await notesCollection.deleteMany({ username: user.username });

    // Delete user account
    await usersCollection.deleteOne({ email });

    // Remove verification code
    verificationCodes.delete(`delete_${email}`);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Route to cancel upload
app.post('/cancel-upload/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const upload = activeUploads.get(uploadId);

  if (upload) {
    upload.isCancelled = true;
    // Cancel all ongoing file uploads
    upload.files.forEach(file => {
      if (file.controller) {
        file.controller.abort();
      }
    });
    console.log(`Upload ${uploadId} cancelled`);
    res.status(200).json({ message: 'Upload cancelled successfully' });
  } else {
    res.status(404).json({ error: 'Upload not found' });
  }
});

// Add route to add files to existing upload
app.post('/add-files/:uploadId', upload.array('files'), async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = activeUploads.get(uploadId);

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found or expired' });
    }

    if (upload.isCancelled) {
      return res.status(400).json({ error: 'Upload was cancelled' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Add new files to existing upload
    const newFiles = req.files.map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      buffer: f.buffer,
      progress: 0,
      status: 'pending',
      controller: null
    }));

    // Append new files
    upload.files.push(...newFiles);

    // Update progress calculation
    const completedFiles = upload.files.filter(f => f.status === 'completed').length;
    upload.progress = Math.round((completedFiles / upload.files.length) * 100);

    res.json({
      success: true,
      message: 'Files added successfully',
      totalFiles: upload.files.length,
      progress: upload.progress
    });
  } catch (error) {
    console.error('Error adding files:', error);
    res.status(500).json({ error: error.message || 'Failed to add files' });
  }
});

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).send('Route not found');
});

// Export app for Vercel compatibility
module.exports = app;

// Start the server only if not running in a serverless environment
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Test IP logging by sending requests to http://localhost:${port}/IP`);
  });
};