export type QiitaItem = {
  title: string;
  url: string;
  createdAt: Date;
};

export async function fetchQiitaItems(perPage: number = 20): Promise<QiitaItem[]> {
  const username = import.meta.env.QIITA_USERNAME as string | undefined;
  if (!username) return [];

  const safePerPage = Math.max(1, Math.min(perPage, 100));
  const url = `https://qiita.com/api/v2/users/${encodeURIComponent(username)}/items?page=1&per_page=${safePerPage}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = import.meta.env.QIITA_TOKEN as string | undefined;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, cache: 'force-cache' });
    if (!res.ok) return [];
    const items = (await res.json()) as Array<{ title: string; url: string; created_at?: string }>;
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map((it) => ({
      title: it.title,
      url: it.url,
      createdAt: it.created_at ? new Date(it.created_at) : new Date(),
    }));
  } catch {
    return [];
  }
}
