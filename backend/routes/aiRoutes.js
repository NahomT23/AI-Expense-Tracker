import express from 'express';
import { generateAdvice, handleChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate', generateAdvice);
router.post('/chat', handleChat);

export default router;