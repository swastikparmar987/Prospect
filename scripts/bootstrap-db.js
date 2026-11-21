const fs = require('fs');
const path = require('path');

function bootstrap() {
  const explicitUrl = process.env.DATABASE_URL;
  if (explicitUrl && (explicitUrl.startsWith('postgres://') || explicitUrl.startsWith('postgresql://'))) {
    console.log('[bootstrap-db] Using PostgreSQL datasource. Skipping SQLite bootstrap.');
    return;
  }

  const rawPath = explicitUrl && explicitUrl.startsWith('file:')
    ? explicitUrl.replace(/^file:/, '')
    : 'dev.db';

  const targetPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const candidates = [
    path.join(process.cwd(), 'prisma', 'starter.db'),
    path.join(__dirname, '..', 'prisma', 'starter.db'),
    path.join(process.cwd(), 'prospect', 'prisma', 'starter.db'),
  ];

  let starterPath = candidates.find(c => {
    try {
      return fs.existsSync(c) && fs.statSync(c).size > 10000;
    } catch {
      return false;
    }
  });

  let targetSize = 0;
  try {
    if (fs.existsSync(targetPath)) {
      targetSize = fs.statSync(targetPath).size;
    }
  } catch {}

  const needsCopy = targetSize < 10000;

  if (needsCopy) {
    if (starterPath) {
      fs.copyFileSync(starterPath, targetPath);
      const newSize = fs.statSync(targetPath).size;
      console.log(`[bootstrap-db] Successfully seeded SQLite database at ${targetPath} from ${starterPath} (${newSize} bytes)`);
    } else {
      console.warn('[bootstrap-db] Warning: No starter.db candidate found with valid size.');
    }
  } else {
    console.log(`[bootstrap-db] Target database already populated at ${targetPath} (${targetSize} bytes)`);
  }
}

bootstrap();
