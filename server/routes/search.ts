import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from '../auth';

const router = Router();

router.use(requireAuth);

// GET /api/search-history - Retrieve recent search queries for current user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 20;
    const history = db.searchHistory.listByUser(userId, limit);
    res.json({ history });
  } catch (err: any) {
    console.error('Error retrieving search history:', err);
    res.status(500).json({ error: 'Failed to retrieve search history.' });
  }
});

// POST /api/search-history - Record a search query
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query string is required.' });
      return;
    }

    const record = await db.searchHistory.record(userId, query.trim());
    res.status(201).json({ item: record });
  } catch (err: any) {
    console.error('Error saving search item:', err);
    res.status(500).json({ error: 'Failed to record search query.' });
  }
});

// DELETE /api/search-history/:id - Delete an individual search query
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await db.searchHistory.delete(id, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Search history item not found or access denied.' });
      return;
    }

    res.json({ message: 'Search history item deleted.' });
  } catch (err: any) {
    console.error('Error deleting search history item:', err);
    res.status(500).json({ error: 'Failed to delete search history item.' });
  }
});

// DELETE /api/search-history - Clear all search history for current user
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await db.searchHistory.clearByUser(userId);
    res.json({ message: 'Search history cleared successfully.', deletedCount: count });
  } catch (err: any) {
    console.error('Error clearing search history:', err);
    res.status(500).json({ error: 'Failed to clear search history.' });
  }
});

export default router;
