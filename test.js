// User registration endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    if (!username || !email || !password) {
      return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  
    try {
      const usersCollection = client.db("Link").collection("User");
      const existingUser = await usersCollection.findOne({ username });
  
      if (existingUser) {
        return res.status(400).send('Username already exists');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10); // Hash password using bcryptjs
      await usersCollection.insertOne({ username, email, password: hashedPassword, createdAt: new Date() });
  
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