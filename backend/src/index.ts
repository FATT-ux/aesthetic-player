import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import YTDlpWrap from 'yt-dlp-wrap';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const binDir = path.join(process.cwd(), 'bin');
const isWin = process.platform === 'win32';
const binaryPath = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');

let ytDlpWrap: YTDlpWrap;
const searchCache = new Map<string, any[]>();
const streamCache = new Map<string, string>();
const coverCache = new Map<string, string>();

async function initYtDlp() {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  if (!fs.existsSync(binaryPath)) {
    const fileName = isWin
      ? 'yt-dlp.exe'
      : process.platform === 'darwin'
      ? 'yt-dlp_macos'
      : 'yt-dlp_linux';

    const downloadUrl = new URL(
      '/yt-dlp/yt-dlp/releases/latest/download/' + fileName,
      'https://github.com'
    );

    const res = await fetch(downloadUrl.toString());
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(binaryPath, buffer);
    if (!isWin) {
      fs.chmodSync(binaryPath, 0o755);
    }
  }
  ytDlpWrap = new YTDlpWrap(binaryPath);
}

app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json([]);
    }

    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
      return res.json(searchCache.get(cacheKey));
    }

    const searchUrl = new URL('/api/search', 'https://lrclib.net');
    searchUrl.searchParams.set('q', query);

    const response = await fetch(searchUrl.toString());
    const items = await response.json();

    const seen = new Set<string>();
    const tracks: any[] = [];

    for (const item of Array.isArray(items) ? items : []) {
      const title = String(item.trackName || '').trim();
      const artist = String(item.artistName || 'Unknown Artist').trim();
      const dedupKey = `${artist.toLowerCase()}-${title.toLowerCase()}`;

      if (!title || seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const streamUrl = new URL('/api/stream', 'http://localhost:' + PORT);
      streamUrl.searchParams.set('q', `${artist} - ${title}`);

      const coverApiUrl = new URL('/api/cover', 'http://localhost:' + PORT);
      coverApiUrl.searchParams.set('q', `${artist} ${title}`);

      tracks.push({
        id: String(item.id),
        title,
        artist,
        album: String(item.albumName || ''),
        coverUrl: coverApiUrl.toString(),
        audioUrl: streamUrl.toString(),
        duration: Math.round(Number(item.duration)) || 180,
      });

      if (tracks.length >= 8) break;
    }

    searchCache.set(cacheKey, tracks);
    res.json(tracks);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({ error: 'Ошибка сервера при поиске' });
  }
});

app.get('/api/cover', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(404).end();

    const cacheKey = q.toLowerCase();
    let coverUrl = coverCache.get(cacheKey);

    if (coverUrl === undefined) {
      const stdout = await ytDlpWrap.execPromise([
        'scsearch1:' + q,
        '--dump-json',
        '--flat-playlist',
        '--no-warnings',
        '--no-check-certificates',
      ]);

      const firstLine = stdout.trim().split('\n').at(0);
      if (firstLine) {
        const info = JSON.parse(firstLine);
        const rawThumb =
          info.thumbnail ||
          (Array.isArray(info.thumbnails) && info.thumbnails.length > 0
            ? info.thumbnails.at(-1)?.url
            : '');
        coverUrl = rawThumb ? String(rawThumb).replace('-large', '-t500x500') : '';
      } else {
        coverUrl = '';
      }
      coverCache.set(cacheKey, coverUrl);
    }

    if (!coverUrl) {
      return res.status(404).end();
    }

    const imgRes = await fetch(coverUrl);
    if (!imgRes.ok || !imgRes.body) {
      return res.status(404).end();
    }

    res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    Readable.fromWeb(imgRes.body as any).pipe(res);
  } catch {
    res.status(404).end();
  }
});

async function getPlayableUrl(target: string, extraArgs: string[] = []): Promise<string | null> {
  try {
    const out = await ytDlpWrap.execPromise([
      '-f',
      'http_mp3_1_0/bestaudio[protocol^=http]',
      '-g',
      '--no-warnings',
      '--no-check-certificates',
      ...extraArgs,
      target,
    ]);
    const url = out.trim().split('\n').at(0);
    if (url && url.startsWith('http') && !url.includes('.m3u8')) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

app.get('/api/stream', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).send('Missing query');
    }

    const cacheKey = q.toLowerCase();
    if (streamCache.has(cacheKey)) {
      return res.redirect(streamCache.get(cacheKey)!);
    }

    let directUrl = await getPlayableUrl('scsearch1:' + q);

    if (!directUrl) {
      directUrl = await getPlayableUrl('scsearch3:' + q, ['--playlist-items', '2,3']);
    }

    if (directUrl) {
      streamCache.set(cacheKey, directUrl);
      return res.redirect(directUrl);
    }

    res.status(404).send('Audio not found');
  } catch (error) {
    console.error('Ошибка стриминга:', error);
    if (!res.headersSent) {
      res.status(500).send('Stream error');
    }
  }
});

app.get('/api/lyrics', async (req, res) => {
  try {
    const artist = String(req.query.artist || '').trim();
    const title = String(req.query.title || '').trim();

    if (!artist || !title) {
      return res.status(400).json({ error: 'Не указан артист или название трека' });
    }

    const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const lyricsUrl = new URL('/api/get', 'https://lrclib.net');
    lyricsUrl.searchParams.set('artist_name', artist);
    lyricsUrl.searchParams.set('track_name', cleanTitle);

    const response = await fetch(lyricsUrl.toString());

    if (!response.ok) {
      return res.json({ syncedLyrics: null, plainLyrics: 'Текст для этой песни не найден' });
    }

    const data = await response.json();
    res.json({
      syncedLyrics: data.syncedLyrics || null,
      plainLyrics: data.plainLyrics || 'Текст для этой песни не найден',
    });
  } catch (error) {
    console.error('Ошибка при загрузке текста:', error);
    res.status(500).json({ error: 'Не удалось загрузить текст песни' });
  }
});

initYtDlp().then(() => {
  app.listen(PORT, () => {
    console.log('Бэкенд запущен на http://localhost:' + PORT);
  });
});
