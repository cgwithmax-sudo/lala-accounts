import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.USER_INFO_DB_ID as string; // already set

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = (req.body ?? {}) as Record<string, string>;
    const username = (body.username ?? '').trim().toLowerCase();
    const password = (body.password ?? '').trim();
    const name = (body.name ?? username).trim();
    const role = (body.role ?? 'Regular').trim(); // default role; change if you like

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Missing username or password' });
    }

    // 1) prevent duplicates
    const existing = await notion.databases.query({
      database_id: DB_ID,
      filter: { property: 'Username', rich_text: { equals: username } },
      page_size: 1,
    });
    if (existing.results.length) {
      return res.status(409).json({ ok: false, error: 'User already exists' });
    }

    // 2) create the row in Notion
    await notion.pages.create({
      parent: { database_id: DB_ID },
      properties: {
        // Match your Notion property names/types:
        // Name = Title, Username = Rich text, Password = Rich text, Roles = Select
        Name: { title: [{ type: 'text', text: { content: name } }] },
        Username: { rich_text: [{ type: 'text', text: { content: username } }] },
        Password: { rich_text: [{ type: 'text', text: { content: password } }] }, // plaintext for demo
        Roles: { select: { name: role } }, // must exist in the DB or Notion will create the option
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
