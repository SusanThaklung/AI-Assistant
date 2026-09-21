import { Router, Request, Response } from 'express';
import { db, UserPreferences } from '../db';
import {
  hashPassword,
  comparePassword,
  generateToken,
  formatUserProfile,
  requireAuth,
} from '../auth';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      res.status(400).json({ error: 'Username must be at least 2 characters long.' });
      return;
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length > 32) {
      res.status(400).json({ error: 'Username must be 32 characters or fewer.' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    // Check unique email
    if (db.users.findByEmail(cleanEmail)) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Check unique username
    if (db.users.findByUsername(cleanUsername)) {
      res.status(400).json({ error: 'This username is already taken. Please choose another.' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const defaultPreferences: UserPreferences = {
      theme: 'light',
      voiceAutoSpeak: true,
      voiceMuted: false,
      language: 'auto',
      enterToSend: true,
      showTimestamps: true,
      responseStyle: 'balanced',
    };

    const user = await db.users.create({
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      preferences: defaultPreferences,
    });

    const token = generateToken(user);

    res.status(201).json({
      user: formatUserProfile(user),
      token,
      message: 'Account created successfully!',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please provide both email/username and password.' });
      return;
    }

    const cleanIdentifier = String(identifier).trim();
    const user = cleanIdentifier.includes('@')
      ? db.users.findByEmail(cleanIdentifier)
      : db.users.findByUsername(cleanIdentifier);

    // Generic error to prevent account enumeration
    const genericAuthError = 'Invalid email/username or password.';

    if (!user) {
      res.status(401).json({ error: genericAuthError });
      return;
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: genericAuthError });
      return;
    }

    const token = generateToken(user);

    res.json({
      user: formatUserProfile(user),
      token,
      message: 'Logged in successfully!',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = db.users.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: formatUserProfile(user) });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { username, preferences } = req.body;

    const updates: any = {};

    if (username && typeof username === 'string') {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 2 || cleanUsername.length > 32) {
        res.status(400).json({ error: 'Username must be between 2 and 32 characters.' });
        return;
      }
      const existing = db.users.findByUsername(cleanUsername);
      if (existing && existing.id !== userId) {
        res.status(400).json({ error: 'Username is already taken.' });
        return;
      }
      updates.username = cleanUsername;
    }

    if (preferences && typeof preferences === 'object') {
      const currentUser = db.users.findById(userId);
      updates.preferences = {
        ...currentUser?.preferences,
        ...preferences,
      };
    }

    const updated = await db.users.update(userId, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: formatUserProfile(updated),
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password confirmation does not match.' });
      return;
    }

    const user = db.users.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const match = await comparePassword(currentPassword, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.users.update(userId, { passwordHash: newHash });

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// DELETE /api/auth/account
router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    const user = db.users.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (password) {
      const match = await comparePassword(password, user.passwordHash);
      if (!match) {
        res.status(400).json({ error: 'Incorrect password.' });
        return;
      }
    }

    await db.users.delete(userId);
    res.json({ message: 'Account and all associated conversations have been permanently deleted.' });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
