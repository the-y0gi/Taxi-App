import express from 'express';
import { riderInformation } from '../controllers/ride.controller.js';
import { userLogin } from '../controllers/user.controller.js';
const router = express.Router();


router.post('/booking', riderInformation);
router.post('/login',userLogin )


export default router;