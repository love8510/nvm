const http = require('http');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const APK_PATH = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const PORT = 8080;
const HOST = '192.168.1.109';
const DOWNLOAD_URL = `http://${HOST}:${PORT}/download`;

const server = http.createServer(async (req, res) => {
  if (req.url === '/download' || req.url === '/app-debug.apk') {
    const stat = fs.statSync(APK_PATH);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="app-debug.apk"',
      'Content-Length': stat.size,
    });
    fs.createReadStream(APK_PATH).pipe(res);
    console.log(`[${new Date().toLocaleTimeString()}] APK 다운로드 요청`);
  } else {
    const apkSize = (fs.statSync(APK_PATH).size / 1024 / 1024).toFixed(2);
    const qrDataUrl = await QRCode.toDataURL(DOWNLOAD_URL, { width: 256, margin: 2 });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>APK 다운로드</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; border-radius: 16px; padding: 36px 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 360px; width: 90%; }
    h2 { margin: 0 0 4px; color: #1a1a1a; font-size: 22px; }
    .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
    .qr-wrap { background: #f8f8f8; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 20px; }
    .qr-wrap img { display: block; }
    .divider { display: flex; align-items: center; gap: 10px; margin: 20px 0; color: #bbb; font-size: 13px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #eee; }
    a.btn { display: block; background: #4CAF50; color: white; text-decoration: none; padding: 15px; border-radius: 10px; font-size: 17px; font-weight: bold; }
    a.btn:active { background: #388E3C; }
    .size { color: #aaa; font-size: 12px; margin-top: 14px; }
    .url { color: #aaa; font-size: 12px; margin-top: 6px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h2>앱 설치</h2>
    <p class="sub">QR코드를 스캔하거나 버튼을 눌러 다운로드하세요</p>
    <div class="qr-wrap">
      <img src="${qrDataUrl}" width="220" height="220" alt="QR Code">
    </div>
    <div class="divider">또는</div>
    <a class="btn" href="/download">APK 직접 다운로드</a>
    <div class="size">파일 크기: ${apkSize} MB</div>
    <div class="url">${DOWNLOAD_URL}</div>
  </div>
</body>
</html>`);
  }
});

server.listen(PORT, '0.0.0.0', async () => {
  const qr = await QRCode.toString(DOWNLOAD_URL, { type: 'terminal', small: true });
  console.log('\n=== APK 다운로드 서버 실행 중 ===\n');
  console.log(qr);
  console.log(`브라우저: http://${HOST}:${PORT}`);
  console.log(`직접 다운로드: ${DOWNLOAD_URL}`);
  console.log('\n종료하려면 Ctrl+C\n');
});
