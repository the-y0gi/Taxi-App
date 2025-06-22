import express from 'express';
import dotenv from 'dotenv';

import cors from 'cors';
import { connectToDB } from './db/db.js';
import rideRoutes from './routes/ride.routes.js';

dotenv.config();

connectToDB();


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', rideRoutes);

app.listen(PORT,()=>{
  console.log(`server is running port ${PORT}`)
})