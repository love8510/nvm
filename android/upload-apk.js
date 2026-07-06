const https = require('https');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const apkPath = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const fileData = fs.readFileSync(apkPath);

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function uploadToServer(hostname, uploadPath) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const header = Buffer.from(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="app-debug.apk"\r\n' +
      'Content-Type: application/vnd.android.package-archive\r\n\r\n'
    );
    const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
    const body = Buffer.concat([header, fileData, footer]);

    const options = {
      hostname,
      path: uploadPath,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('APK 업로드 중... (' + (fileData.length / 1024 / 1024).toFixed(2) + ' MB)');

  // 1단계: 업로드 서버 조회
  const servers = await httpsGet('https://api.gofile.io/servers');
  const server = servers.data.servers[0].name;
  console.log('서버 연결:', server);

  // 2단계: 파일 업로드
  const result = await uploadToServer(`${server}.gofile.io`, '/contents/uploadfile');

  if (result.status === 'ok') {
    const url = result.data.downloadPage;
    console.log('\n업로드 완료!');
    console.log('다운로드 URL:', url);

    const qr = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log('\n[QR코드 - 핸드폰으로 스캔]\n');
    console.log(qr);

    await QRCode.toFile('qr-download.png', url, { width: 400, margin: 2 });
    console.log('QR 이미지 저장됨: qr-download.png');
  } else {
    console.error('업로드 실패:', JSON.stringify(result));
  }
}

main().catch(e => console.error('오류:', e.message));
