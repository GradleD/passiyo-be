import { Router } from 'express';
const router = Router();

// Add your export routes here
router.get('/export', (req, res) => {
    res.json({ message: 'Export route' });
});

export default router;