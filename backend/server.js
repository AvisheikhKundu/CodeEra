// === Change Password ===
app.put('/api/profile/password', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both fields are required.' });
  }
  const user = await User.findById(req.session.userId);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password changed successfully.' });
});
// ...existing code...
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require('./models/User');
const Course = require('./models/Course');
const session = require('express-session');

dotenv.config();

const app = express();

// === Middleware ===
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'codeera_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// === Serve Static Files ===
app.use(express.static(path.join(__dirname, 'public')));

// === Connect to MongoDB ===
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// === Signup Route ===
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    req.session.userId = newUser._id;
    res.status(201).json({ message: 'User registered successfully', user: { name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// === Login Route ===
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    req.session.userId = user._id;
    res.status(200).json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// === Logout Route ===
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// === Profile Route ===
app.get('/api/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId).select('-password');
  res.json({ user });
});

// === Update Profile ===
app.put('/api/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { name, bio, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { $set: { name, bio, avatar } },
    { new: true }
  ).select('-password');
  res.json({ message: 'Profile updated', user });
});

// === Get user's enrolled courses ===
app.get('/api/my-courses', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId).populate('enrolledCourses');
  res.json({ courses: user.enrolledCourses });
});

// === List all courses ===
app.get('/api/courses', async (req, res) => {
  const courses = await Course.find();
  res.json({ courses });
});

// === Get single course ===
app.get('/api/courses/:id', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json({ course });
});

// === Create a new course ===
app.post('/api/courses', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId);
  if (!user || user.role !== 'instructor') {
    return res.status(403).json({ message: 'Only instructors can create courses.' });
  }
  const { title, description, instructor, image } = req.body;
  if (!title || !instructor) {
    return res.status(400).json({ message: 'Title and instructor required.' });
  }
  const course = new Course({ title, description, instructor, image });
  await course.save();
  res.json({ message: 'Course created', course });
});

// === Update course ===
app.put('/api/courses/:id', async (req, res) => {
  const { title, description, instructor, image } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $set: { title, description, instructor, image } },
    { new: true }
  );
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json({ message: 'Course updated', course });
});

// === Delete course ===
app.delete('/api/courses/:id', async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json({ message: 'Course deleted' });
});

// === Enroll in a course ===
app.post('/api/courses/:id/enroll', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  if (!course.enrolledUsers.includes(req.session.userId)) {
    course.enrolledUsers.push(req.session.userId);
    await course.save();
  }
  await User.findByIdAndUpdate(req.session.userId, { $addToSet: { enrolledCourses: course._id } });
  res.json({ message: 'Enrolled successfully' });
});

// === Fallback to index.html for frontend routes ===
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});


// === Start Server ===
const PORT = process.env.PORT || 5069;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
