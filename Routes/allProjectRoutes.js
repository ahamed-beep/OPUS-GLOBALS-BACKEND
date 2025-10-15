import express from 'express';
import {  getUserData, unifiedLogin, updateUserPassword, userControllers, verifyToken } from '../Controllers/userControllers.js';
import { AdminUserControllers } from '../Controllers/adminController.js';

const router = express.Router();


// All routes here is for usermodel
router.post('/createuser', userControllers);
router.put('/update/:id', updateUserPassword);
router.post('/login', unifiedLogin);


router.get('/user-data', verifyToken, getUserData);

// All routes here is for admincreatemodel
router.post('/admincreateuser', AdminUserControllers);







export default router;