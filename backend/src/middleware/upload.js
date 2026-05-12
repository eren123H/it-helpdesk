const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const fsp = require('fs/promises');
const { fromFile } = require('file-type');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// uploads klasörü yoksa oluştur
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts   = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB'a yükseltildi
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. İzin verilenler: görseller, PDF, TXT, DOCX'));
    }
  },
});

const MIME_COMPATIBILITY = {
  'image/jpeg': new Set(['image/jpeg']),
  'image/png': new Set(['image/png']),
  'image/gif': new Set(['image/gif']),
  'image/webp': new Set(['image/webp']),
  'application/pdf': new Set(['application/pdf']),
  // Eski .doc dosyaları bazı ortamlarda application/x-cfb olarak algılanabiliyor.
  'application/msword': new Set(['application/msword', 'application/x-cfb']),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
};

function isLikelyPlainText(buffer) {
  if (!buffer || buffer.length === 0) return true;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  for (const byte of sample) {
    if (byte === 0) return false;
  }
  return true;
}

async function cleanupFiles(files = []) {
  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return;
      try {
        await fsp.unlink(file.path);
      } catch {
        // Dosya zaten silinmiş olabilir.
      }
    })
  );
}

async function validateUploadedFiles(req, res, next) {
  if (!req.files?.length) return next();

  try {
    for (const file of req.files) {
      const declaredMime = file.mimetype;
      const detected = await fromFile(file.path);

      if (declaredMime === 'text/plain') {
        // file-type metin dosyalarında undefined dönebilir; bu yüzden basit binary kontrolü yapıyoruz.
        const fileBuffer = await fsp.readFile(file.path);
        if (detected || !isLikelyPlainText(fileBuffer)) {
          await cleanupFiles(req.files);
          return res.status(400).json({
            error: `Dosya içeriği geçersiz: ${file.originalname}`,
          });
        }
        continue;
      }

      if (!detected) {
        await cleanupFiles(req.files);
        return res.status(400).json({
          error: `Dosya türü doğrulanamadı: ${file.originalname}`,
        });
      }

      const allowedDetectedMimes = MIME_COMPATIBILITY[declaredMime];
      if (!allowedDetectedMimes || !allowedDetectedMimes.has(detected.mime)) {
        await cleanupFiles(req.files);
        return res.status(400).json({
          error: `Dosya içeriği uzantı/MIME ile uyuşmuyor: ${file.originalname}`,
        });
      }
    }

    next();
  } catch (err) {
    await cleanupFiles(req.files);
    return res.status(400).json({
      error: err.message || 'Dosya doğrulama sırasında hata oluştu',
    });
  }
}

module.exports = { upload, UPLOADS_DIR, validateUploadedFiles };
