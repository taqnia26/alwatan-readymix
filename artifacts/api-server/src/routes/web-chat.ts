import { createHash, randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db, chatConversationsTable as conversations, chatMessagesTable as messages } from '@workspace/db';
import { StartVisitorChatBody, SendVisitorMessageBody } from '@workspace/api-zod';
import { requireAdmin, requireSameOrigin } from '../lib/auth';

const router = Router();
const cookieName = 'alwatan_visitor_chat';
const lifetime = 30 * 24 * 60 * 60 * 1000;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const limits = new Map<string, { count: number; until: number }>();
let nextSweep = 0;

function rateLimit(req: Request, res: Response, scope: 'start' | 'message') {
  const now = Date.now();
  if (now > nextSweep) {
    for (const [key, entry] of limits) if (entry.until < now) limits.delete(key);
    nextSweep = now + 60_000;
  }
  const key = `${scope}:${req.ip}`;
  let entry = limits.get(key);
  if (entry && entry.until <= now) { limits.delete(key); entry = undefined; }
  if (!entry) {
    if (limits.size >= 10_000) { res.status(429).json({ error: 'Please try again later' }); return false; }
    entry = { count: 0, until: now + 10 * 60_000 };
    limits.set(key, entry);
  }
  const maximum = scope === 'start' ? 5 : 40;
  if (entry.count >= maximum) {
    res.setHeader('Retry-After', Math.ceil((entry.until - now) / 1000));
    res.status(429).json({ error: 'Too many messages. Please try again later.' });
    return false;
  }
  entry.count++;
  return true;
}

async function visitor(req: Request) {
  const token = req.cookies?.[cookieName];
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined;
  const [row] = await db.select({ id: conversations.id }).from(conversations)
    .where(and(eq(conversations.tokenHash, hash(token)), gt(conversations.expiresAt, new Date())));
  return row;
}
const conversationFields = {
  id: conversations.id, name: conversations.name, phone: conversations.phone, email: conversations.email,
  createdAt: conversations.createdAt, updatedAt: conversations.updatedAt,
  // Keep the outer reference explicitly qualified: a single-table Drizzle
  // projection can otherwise turn interpolated columns into an inner "id".
  unreadCount: sql<number>`(SELECT count(*)::int FROM chat_messages cm WHERE cm.conversation_id = "chat_conversations"."id" AND cm.sender = 'visitor' AND cm.is_read = false)`,
  lastMessage: sql<string>`COALESCE((SELECT cm.content FROM chat_messages cm WHERE cm.conversation_id = "chat_conversations"."id" ORDER BY cm.id DESC LIMIT 1), '')`,
};
async function session(id: number) {
  const [conversation] = await db.select(conversationFields).from(conversations).where(eq(conversations.id, id));
  if (!conversation) return undefined;
  const latest = await db.select({
    id: messages.id, conversationId: messages.conversationId, sender: messages.sender,
    content: messages.content, createdAt: messages.createdAt,
  }).from(messages).where(eq(messages.conversationId, id)).orderBy(desc(messages.id)).limit(200);
  return { conversation, messages: latest.reverse() };
}
function messageText(body: unknown, res: Response) {
  const parsed = SendVisitorMessageBody.safeParse(body);
  if (!parsed.success || !parsed.data.content.trim()) {
    res.status(400).json({ error: 'A message of 1–2000 characters is required' }); return undefined;
  }
  return parsed.data.content.trim();
}
function conversationId(value: unknown, res: Response) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: 'Invalid conversation' }); return undefined; }
  return id;
}

router.get('/chat', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const current = await visitor(req);
  res.json(current ? await session(current.id) : { conversation: null, messages: [] });
});
router.post('/chat', requireSameOrigin, async (req, res) => {
  const parsed = StartVisitorChatBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.name.trim() || !parsed.data.content.trim()
    || (parsed.data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.email.trim()))) {
    res.status(400).json({ error: 'Check your name, email and message' }); return;
  }
  const existing = await visitor(req);
  if (!rateLimit(req, res, existing ? 'message' : 'start')) return;
  const token = randomBytes(32).toString('base64url');
  const id = await db.transaction(async tx => {
    let id = existing?.id;
    if (!id) {
      const [created] = await tx.insert(conversations).values({
        tokenHash: hash(token), name: parsed.data.name.trim(), phone: parsed.data.phone?.trim() || '',
        email: parsed.data.email?.trim() || '', expiresAt: new Date(Date.now() + lifetime),
      }).returning({ id: conversations.id });
      id = created.id;
    }
    await tx.insert(messages).values({ conversationId: id, sender: 'visitor', content: parsed.data.content.trim() });
    await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
    return id;
  });
  if (!existing) res.cookie(cookieName, token, {
    httpOnly: true, sameSite: 'lax', secure: req.secure || process.env.NODE_ENV === 'production',
    path: '/api/chat', maxAge: lifetime,
  });
  res.status(201).json(await session(id));
});
router.post('/chat/messages', requireSameOrigin, async (req, res) => {
  const current = await visitor(req);
  if (!current) { res.status(401).json({ error: 'Start a conversation first' }); return; }
  const content = messageText(req.body, res);
  if (!content || !rateLimit(req, res, 'message')) return;
  const row = await db.transaction(async tx => {
    const [created] = await tx.insert(messages).values({ conversationId: current.id, sender: 'visitor', content }).returning();
    await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, current.id));
    return created;
  });
  const { isRead: _, ...publicMessage } = row;
  res.status(201).json(publicMessage);
});
router.get('/admin/chats', requireAdmin, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const offset = Number(req.query.offset ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) {
    res.status(400).json({ error: 'Invalid offset' }); return;
  }
  res.json(await db.select(conversationFields).from(conversations).orderBy(desc(conversations.updatedAt), desc(conversations.id)).limit(100).offset(offset));
});
router.get('/admin/chats/:id', requireAdmin, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = conversationId(req.params.id, res); if (!id) return;
  const current = await session(id);
  if (!current) { res.status(404).json({ error: 'Conversation not found' }); return; }
  res.json(current);
});
router.post('/admin/chats/:id/read', requireAdmin, requireSameOrigin, async (req, res) => {
  const id = conversationId(req.params.id, res); if (!id) return;
  const [current] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, id));
  if (!current) { res.status(404).json({ error: 'Conversation not found' }); return; }
  await db.update(messages).set({ isRead: true }).where(and(eq(messages.conversationId, id), eq(messages.sender, 'visitor'), eq(messages.isRead, false)));
  res.status(204).end();
});
router.post('/admin/chats/:id/messages', requireAdmin, requireSameOrigin, async (req, res) => {
  const id = conversationId(req.params.id, res); if (!id) return;
  const content = messageText(req.body, res); if (!content) return;
  const [current] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, id));
  if (!current) { res.status(404).json({ error: 'Conversation not found' }); return; }
  const row = await db.transaction(async tx => {
    const [created] = await tx.insert(messages).values({ conversationId: id, sender: 'admin', content, isRead: true }).returning();
    await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
    await tx.update(messages).set({ isRead: true }).where(and(eq(messages.conversationId, id), eq(messages.sender, 'visitor')));
    return created;
  });
  const { isRead: _, ...publicMessage } = row;
  res.status(201).json(publicMessage);
});
export default router;
