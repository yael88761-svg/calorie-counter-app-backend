require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { createLogger } = require('./middleware/logger.middleware');
const weeklyEmailJob = require('./jobs/weekly-email.job');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const logRoutes = require('./routes/log.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(createLogger({ env: process.env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(status).json({ success: false, message });
});

weeklyEmailJob.start();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
