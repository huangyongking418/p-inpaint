/**
 * 模型下载脚本
 * 下载 MI-GAN ONNX 模型到本地
 * 用法: node scripts/download-model.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MODELS = [
  {
    name: 'migan_pipeline_v2.onnx',
    url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
    backupUrl: 'https://worker-share-proxy-01f5.lxfater.workers.dev/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
  }
];

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total && onProgress) {
          onProgress(Math.round((downloaded / total) * 100));
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  for (const model of MODELS) {
    const dest = path.join(MODELS_DIR, model.name);

    if (fs.existsSync(dest)) {
      console.log(`[✓] ${model.name} 已存在，跳过下载`);
      continue;
    }

    console.log(`[↓] 正在下载 ${model.name}...`);
    console.log(`    源: ${model.url}`);

    try {
      await downloadFile(model.url, dest, (progress) => {
        process.stdout.write(`\r    下载进度: ${'█'.repeat(progress / 5)}${'░'.repeat(20 - progress / 5)} ${progress}%`);
      });
      console.log(`\n[✓] ${model.name} 下载完成`);
    } catch (e) {
      console.log(`\n[!] 主源下载失败: ${e.message}`);
      if (model.backupUrl) {
        console.log(`[↓] 尝试备用源: ${model.backupUrl}`);
        try {
          await downloadFile(model.backupUrl, dest, (progress) => {
            process.stdout.write(`\r    下载进度: ${'█'.repeat(progress / 5)}${'░'.repeat(20 - progress / 5)} ${progress}%`);
          });
          console.log(`\n[✓] ${model.name} 下载完成 (备用源)`);
        } catch (e2) {
          console.log(`\n[✗] ${model.name} 下载失败: ${e2.message}`);
          console.log('    请手动下载模型文件后放入 public/models/ 目录');
        }
      } else {
        console.log(`[✗] ${model.name} 下载失败`);
      }
    }
    console.log('');
  }

  console.log('[✓] 全部模型处理完成');
}

main().catch(console.error);
