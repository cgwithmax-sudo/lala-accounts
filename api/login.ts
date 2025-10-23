import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client as NotionClient } from '@notionhq/client';
import { z } from 'zod';

const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

function propToText(p: any): string {
  if (!p) return '';
  if (p.type === 'title') return (p.title?.[0]?.plain_text ?? '').trim();
  if (p.type === 'rich_text') return (p.rich_text?.[0]?.plain_text ?? '').trim();
  if (p.type === 'text') return (p.text?.content ?? '').trim();
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const USER_INFO_DB_ID = process.env.USER_INFO_DB_ID;
  if (!NOTION_TOKEN || !USER_INFO_DB_ID) {
    res.status(500).json({ ok: false, error: 'Server misconfigured.' });
    return;
  }
  try {
    const { username, password } = LoginSchema.parse(req.body ?? {});
    const uname = (username || '').trim();
    if (!uname || !password) {
      res.status(400).json({ ok: false, error: 'Username and password are required.' });
      return;
    }

    const notion = new NotionClient({ auth: NOTION_TOKEN });
    const q = await notion.databases.query({
      database_id: USER_INFO_DB_ID,
      filter: { property: 'Username', rich_text: { equals: uname } },
      page_size: 1,
    });

    if (!q.results || q.results.length === 0) {
      res.status(401).json({ ok: false, error: 'No such user.' });
      return;
    }

    const page: any = q.results[0];
    const props: any = page.properties || {};
    const name = propToText(props.Name) || propToText(props.Title) || '';
    const user = propToText(props.Username);
    const pass = propToText(props.Password);
    const role = (props.Roles?.select?.name) ? props.Roles.select.name : 'Regular';

    if (pass !== password) {
      res.status(401).json({ ok: false, error: 'Wrong password.' });
      return;
    }

    res.status(200).json({ ok: true, user: { name: name || user, username: user, role } });
  } catch (err: any) {
    if (err?.issues) {
      res.status(400).json({ ok: false, error: 'Invalid request.' });
      return;
    }
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error.' });
  }
}
