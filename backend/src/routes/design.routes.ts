import { Router } from 'express';
import {
  createDesign,
  getDesigns,
  getDesignById,
  updateDesign,
  deleteDesign,
} from '../controllers/design.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All design routes require authentication
router.use(authenticateToken);

router.post('/', createDesign);
router.get('/', getDesigns);
router.get('/:id', getDesignById);
router.put('/:id', updateDesign);
router.delete('/:id', deleteDesign);

export default router;

