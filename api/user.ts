// /api/user.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN! });
const USER_INFO_DB_ID = process.env.USER_INFO_DB_ID!;

function getText(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'title') return (prop.title?.[0]?.plain_text ?? '').trim();
  if (prop.type === 'rich_text') return (prop.rich_text?.[0]?.plain_text ?? '').trim();
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const username = (req.query.username as string || '').trim();
  if (!username) return res.status(400).json({ ok: false, error: 'Missing username' });

  try {
    const query = await notion.databases.query({
      database_id: USER_INFO_DB_ID,
      filter: { property: 'Username', rich_text: { equals: username } },
      page_size: 1,
    });

    if (query.results.length === 0) {
      return res.status(404).json({ ok: false, error: 'No such user.' });
    }

    const page: any = query.results[0];
    const props: any = page.properties;

    const name = getText(props.Name);
    const user = getText(props.Username);
    const role = props.Roles?.select?.name ?? 'Regular';

    return res.json({ ok: true, user: { name: name || user, username: user, role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
}
