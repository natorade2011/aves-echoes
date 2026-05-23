const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

// Helper to determine mime type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // 1-Click Publisher endpoint
  if (req.method === 'POST' && req.url === '/api/publish') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Save the optimized photograph
        const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, "");
        const imagePath = path.join(PUBLIC_DIR, 'images', data.imageName);
        fs.writeFileSync(imagePath, base64Data, 'base64');
        
        // Update posts.json database
        const dbPath = path.join(PUBLIC_DIR, 'posts.json');
        let db = [];
        if (fs.existsSync(dbPath)) {
          db = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '[]');
        }
        
        const newPost = {
          id: data.id,
          category: data.category,
          tag: data.tag,
          title: data.title,
          excerpt: data.excerpt,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          author: data.author,
          authorAvatar: data.authorAvatar,
          readingTime: data.readingTime,
          image: `images/${data.imageName}`,
          speciesFacts: data.speciesFacts,
          content: data.content
        };
        
        db.unshift(newPost);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        
        // Execute automated background Git staging, commit, and push
        const gitCmd = `git add posts.json "images/${data.imageName}" && git commit -m "Publish: ${data.title.replace(/"/g, '\\"')}" && git push origin main`;
        
        console.log(`\n📦 Staging files for commit: posts.json, images/${data.imageName}...`);
        exec(gitCmd, { cwd: PUBLIC_DIR }, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Git execution error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
            return;
          }
          
          console.log('✅ Git push completed successfully:\n', stdout);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        });
        
      } catch (err) {
        console.error('❌ API Endpoint Error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }
  
  // Serve static application files (with cache-busting compatibility)
  let safeUrl = req.url.split('?')[0];
  if (safeUrl === '/') safeUrl = '/index.html';
  
  const filePath = path.join(PUBLIC_DIR, safeUrl);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Localhost 1-Click Publishing Server active at http://localhost:${PORT}`);
  console.log(`👉 Run 'node server.js' instead of serve to enjoy single-click automated publishing!`);
});
