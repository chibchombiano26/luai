import fs from 'node:fs/promises';
import path from 'node:path';

const AUTH_MEDIA_FILES = {
  'loader-1-lite': {
    filePath: path.join(process.cwd(), 'landing', 'loader', 'loader_1_lite.mp4'),
    contentType: 'video/mp4',
  },
  'loader-1-poster': {
    filePath: path.join(process.cwd(), 'landing', 'loader', 'loader_1_poster.jpg'),
    contentType: 'image/jpeg',
  },
  'loader-2-lite': {
    filePath: path.join(process.cwd(), 'landing', 'loader', 'loader_2_lite.mp4'),
    contentType: 'video/mp4',
  },
  'loader-2-poster': {
    filePath: path.join(process.cwd(), 'landing', 'loader', 'loader_2_poster.jpg'),
    contentType: 'image/jpeg',
  },
  mascot: {
    filePath: path.join(process.cwd(), 'landing', 'mascot', 'lu_ai.jpg'),
    contentType: 'image/jpeg',
  },
} as const;

export async function GET(
  request: Request,
  context: { params: Promise<{ asset: string }> }
) {
  const { asset } = await context.params;
  const media = AUTH_MEDIA_FILES[asset as keyof typeof AUTH_MEDIA_FILES];

  if (!media) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const stat = await fs.stat(media.filePath);
    const rangeHeader = request.headers.get('range');

    if (media.contentType === 'video/mp4' && rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      if (!match) {
        return new Response('Invalid range', { status: 416 });
      }

      const start = Number.parseInt(match[1], 10);
      const requestedEnd = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
      const end = Math.min(requestedEnd, stat.size - 1);

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
        return new Response('Invalid range', { status: 416 });
      }

      const handle = await fs.open(media.filePath, 'r');
      try {
        const chunkSize = end - start + 1;
        const buffer = Buffer.alloc(chunkSize);
        await handle.read(buffer, 0, chunkSize, start);

        return new Response(buffer, {
          status: 206,
          headers: {
            'Content-Type': media.contentType,
            'Content-Length': String(chunkSize),
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } finally {
        await handle.close();
      }
    }

    const buffer = await fs.readFile(media.filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': media.contentType,
        'Content-Length': String(stat.size),
        'Accept-Ranges': media.contentType === 'video/mp4' ? 'bytes' : 'none',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
