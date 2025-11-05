import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, access, copyFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.split('=');
  args.set(key, value ?? true);
}

const distDir = resolve('dist');
const outputPath = resolve(args.get('--output') ?? 'pdf/skillsheet.pdf');
const skipBuild = args.has('--skip-build');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function ensureBuild() {
  if (skipBuild) {
    if (!existsSync(distDir)) {
      throw new Error('dist/ ディレクトリが見つかりません。--skip-build を外すか、先に npm run build を実行してください。');
    }
    return;
  }

  await new Promise((resolveBuild, rejectBuild) => {
    const child = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolveBuild();
      } else {
        rejectBuild(new Error(`npm run build がコード ${code} で終了しました`));
      }
    });
    child.on('error', rejectBuild);
  });
}

function startStaticServer(rootDir) {
  return new Promise((resolveServer, rejectServer) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let fsPath = join(rootDir, decodeURIComponent(url.pathname));

      try {
        const stats = statSync(fsPath);
        if (stats.isDirectory()) {
          fsPath = join(fsPath, 'index.html');
        }
      } catch (error) {
        // Not found -> try index.html fallback
        fsPath = join(rootDir, 'index.html');
      }

      try {
        const stats = statSync(fsPath);
        if (!stats.isFile()) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const ext = extname(fsPath).toLowerCase();
        const contentType = mimeTypes[ext] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        createReadStream(fsPath).pipe(res);
      } catch (error) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolveServer({ server, port: address.port });
      } else {
        rejectServer(new Error('ポート番号の取得に失敗しました'));
      }
    });

    server.on('error', rejectServer);
  });
}

async function generatePdf(baseUrl) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/skillsheet/pdf/`, { waitUntil: 'networkidle' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
  await page.emulateMedia({ media: 'print' });

  const outputDir = resolve(outputPath, '..');
  try {
    await access(outputDir);
  } catch (error) {
    await mkdir(outputDir, { recursive: true });
  }

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
    displayHeaderFooter: false,
  });

  await browser.close();

  const publicPdfPath = resolve('public/skillsheet.pdf');
  await copyFile(outputPath, publicPdfPath);
}

(async () => {
  await ensureBuild();
  const { server, port } = await startStaticServer(distDir);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await generatePdf(baseUrl);
    console.log(`Skill Sheet PDF を出力しました: ${outputPath}`);
    console.log(`公開用PDFを更新しました: public/skillsheet.pdf`);
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  if (error?.message?.includes('Executable doesn\'t exist')) {
    console.error('Playwrightのブラウザが未インストールです。`npx playwright install` を実行してください。');
  }
  process.exitCode = 1;
});
