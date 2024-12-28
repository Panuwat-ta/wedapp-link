const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = 8080;

// MongoDB URI และ Client
const uri = "mongodb+srv://panuwattakham2002:panuwat@cluster0.fqj8y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// เชื่อมต่อกับ MongoDB เมื่อเริ่มเซิร์ฟเวอร์
client.connect().then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// middleware สำหรับการ parse JSON
app.use(express.json());

// กำหนดให้ Express ให้บริการไฟล์ static
app.use(express.static(path.join(__dirname, 'public')));

// Route สำหรับหน้า Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับไฟล์ date.html
app.get('/date.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'date.html'));
});

// Route สำหรับไฟล์ profile.html
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'profile.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route สำหรับส่งข้อมูล MongoDB
app.get('/data', async (req, res) => {
  try {
    const collection = client.db("Link").collection("link");
    const data = await collection.find().toArray();
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
    const collection = client.db("Link").collection("link");
    await collection.insertOne({ url, name, date });
    res.status(201).send('เพิ่มลิงก์สำเร็จ');
  } catch (error) {
    console.error("Error adding link:", error);
    res.status(500).send("Error adding link");
  }
});

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

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});