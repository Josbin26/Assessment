require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes/applications');
const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(x => x.trim()) }));
app.use(express.json());
app.get('/api/health', (_req,res) => res.json({success:true,message:'API is running',data:{status:'ok'}}));
app.use('/api/applications', routes);
app.use((_req,res) => res.status(404).json({success:false,message:'Endpoint not found',data:null}));
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({success:false,message:'Internal server error',data:null}); });
mongoose.connect(process.env.MONGODB_URI).then(() => {
 console.log('MongoDB connected');
 app.listen(process.env.PORT || 5000, () => console.log(`API listening on ${process.env.PORT || 5000}`));
}).catch(err => { console.error('MongoDB connection failed:',err.message); process.exit(1); });
