const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
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
  .connect("mongodb+srv://codeera:Avisheikh01@cluster1.3lninsf.mongodb.net/CodeEra?retryWrites=true&w=majority&appName=Cluster1", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

const authRoutes = require('./routes/auth');

// === Routes ===
app.use('/api/auth', authRoutes);

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

// === Get user's enrolled courses ===
app.get('/api/my-courses', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId).populate('enrolledCourses');
  res.json({ courses: user.enrolledCourses });
});

// === Get all users (Admin only) ===
app.get('/api/all-users', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const adminUser = await User.findById(req.session.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
// === Enroll in a course ===
app.post('/api/courses/:id/enroll', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  // Only students can enroll
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can enroll in courses.' });
  }
  // Add course to user's enrolledCourses if not already enrolled
  if (!user.enrolledCourses.includes(course._id)) {
    user.enrolledCourses.push(course._id);
    await user.save();
  }
  // Add user to course's enrolledUsers if not already enrolled
  if (!course.enrolledUsers) course.enrolledUsers = [];
  if (!course.enrolledUsers.includes(user._id)) {
    course.enrolledUsers.push(user._id);
    await course.save();
  }
  res.json({ message: 'Enrolled successfully' });
});

// === Drop a course ===
app.post('/api/courses/:id/drop', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Remove course from user's enrolledCourses
  const courseIndex = user.enrolledCourses.indexOf(course._id);
  if (courseIndex > -1) {
    user.enrolledCourses.splice(courseIndex, 1);
    await user.save();
  }

  // Remove user from course's enrolledUsers
  if (course.enrolledUsers) {
    const userIndex = course.enrolledUsers.indexOf(user._id);
    if (userIndex > -1) {
      course.enrolledUsers.splice(userIndex, 1);
      await course.save();
    }
  }

  res.json({ message: 'Dropped course successfully' });
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