import express from 'express';
import { updateUserPassword, userControllers, userLogin } from '../Controllers/userControllers.js';
import { AdminCreatedUserLogin, AdminUserControllers } from '../Controllers/adminController.js';

const router = express.Router();


// All routes here is for usermodel
router.post('/createuser', userControllers);
router.put('/update/:id', updateUserPassword);
router.post('/userlogin', userLogin);

// All routes here is for admincreatemodel
router.post('/admincreateuser', AdminUserControllers);
router.post('/userlog', AdminCreatedUserLogin);





export default router;