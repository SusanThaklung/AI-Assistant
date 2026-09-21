import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// All conversation routes require authentication
router.use(requireAuth);

// GET /api/conversations - List all conversations of the authenticated user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const conversations = db.conversations.listByUser(userId, query);
    res.json({ conversations });
  } catch (err: any) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

// POST /api/conversations - Create a new empty conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;
    const conv = await db.conversations.create(userId, title || 'New Chat');
    res.status(201).json({ conversation: conv });
  } catch (err: any) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// GET /api/conversations/:id - Get conversation details and its messages
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conv = db.conversations.findById(id, userId);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    const messages = db.messages.listByConversation(id, userId);
    res.json({ conversation: conv, messages });
  } catch (err: any) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to retrieve conversation details.' });
  }
});

// PATCH /api/conversations/:id - Rename a conversation
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title cannot be empty.' });
      return;
    }

    const updated = await db.conversations.updateTitle(id, userId, title.trim());
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ conversation: updated });
  } catch (err: any) {
    console.error('Error renaming conversation:', err);
    res.status(500).json({ error: 'Failed to rename conversation.' });
  }
});

// DELETE /api/conversations/:id - Delete a conversation and its messages
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await db.conversations.delete(id, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found or access denied.' });
      return;
    }

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

export default router;
