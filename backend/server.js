require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const buyLetterRoutes = require('./routes/buyLetter');
const sellLetterRoutes = require('./routes/selLetter');
const dashboardRoutes = require('./routes/dashboard');
const serviceBillRoutes = require('./routes/serviceBillRoutes');
const { protect } = require('./middleware/auth');
const cors = require('cors');

const app = express();

connectDB();

app.use(express.json());
app.use(cors({ origin: 'https://ok-motor.onrender.com', credentials: true }));


app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/buy-letter', buyLetterRoutes);
app.use('/api/sell-letters',sellLetterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/service-bills', serviceBillRoutes);

const PORT = 2500;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));