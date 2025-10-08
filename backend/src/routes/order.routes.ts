import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;

