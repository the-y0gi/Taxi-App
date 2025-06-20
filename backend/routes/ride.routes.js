import express from 'express';
import { riderInformation } from '../controllers/ride.controller.js';
import { optVerify, userLogin } from '../controllers/user.controller.js';



const router = express.Router();


router.post('/booking', riderInformation);
router.post('/login',userLogin);
router.post('/otp-verify', optVerify);



export default router;