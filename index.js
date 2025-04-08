require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // Replace bcrypt with bcryptjs

const app = express();
const port = process.env.PORT || 3000;

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route สำหรับหน้า Home
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // หลีกเลี่ยงการแคชไฟล์ HTML
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับไฟล์ date.html
app.get('/date.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'date.html'));
});

// Route สำหรับไฟล์ profile.html
app.get('/about.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'about.html'));
});

// Route สำหรับไฟล์ index.html
app.get('/index.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับไฟล์ login.html
app.get('/login.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

// Route สำหรับไฟล์ upload.html
app.get('/upload.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'upload.html'));
});

// Route สำหรับไฟล์ files.html
app.get('/files.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'files.html'));
});

// Route สำหรับไฟล์ suport.html
app.get('/suport.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'suport.html'));
});

// Route สำหรับไฟล์ logout.html
app.get('/logout.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'templates', 'logout.html'));
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
          }
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

// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  try {
    const usersCollection = client.db("Link").collection("User");
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password); // Compare password using bcryptjs
    if (!passwordMatch) {
      return res.status(401).send('Invalid username or password');
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
    res.status(500).send("Error logging in");
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
        const username = req.headers['x-username']; // รับ username จาก header
        if (!username) {
            return res.status(400).json({ error: 'กรุณาส่ง username ใน header' });
        }

        const usersCollection = client.db("Link").collection("User");
        const user = await usersCollection.findOne({ username });

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
// Route สำหรับตรวจสอบ username
app.get('/check-username', async (req, res) => {
  try {
      const { username } = req.query;
      if (!username) {
          return res.status(400).json({ available: false });
      }

      const usersCollection = client.db("Link").collection("User");
      const existingUser = await usersCollection.findOne({ username });

      // ถ้าไม่พบผู้ใช้หรือเป็นผู้ใช้ปัจจุบัน ให้ถือว่าว่าง
      const currentUsername = req.headers['x-username'];
      if (!existingUser || (currentUsername && existingUser.username === currentUsername)) {
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
      const existingUser = await usersCollection.findOne({ email });

      // ถ้าไม่พบผู้ใช้หรือเป็นผู้ใช้ปัจจุบัน ให้ถือว่าว่าง
      const currentUsername = req.headers['x-username'];
      if (!existingUser || (currentUsername && existingUser.username === currentUsername)) {
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
  console.log(`Extracted IP: ${ip || 'No IP found'}`); // เพิ่ม log เพื่อตรวจสอบ IP ที่ดึงมา
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
    console.log(`IP processed: ${JSON.stringify(result)}`); // เพิ่ม log เพื่อตรวจสอบผลลัพธ์
    res.status(200).send('IP processed successfully');
  } catch (error) {
    console.error("Error processing IP:", error.message); // เพิ่ม log ข้อความ error
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
      console.log(`Logged IP to database: ${JSON.stringify(result)}`); // เพิ่ม log เพื่อตรวจสอบผลลัพธ์การบันทึก
    } catch (error) {
      console.error("Error logging IP:", error.message); // เพิ่ม log ข้อความ error
    }
  } else {
    console.error('Unable to retrieve IP for logging'); // เพิ่ม log กรณีไม่สามารถดึง IP ได้
  }
  next();
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
}