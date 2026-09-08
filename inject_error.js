import fs from 'fs';
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('window.onerror')) {
  code = code.replace(
    '</head>',
    `<script>
      window.onerror = function(message, source, lineno, colno, error) {
        document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: sans-serif;">' + 
          '<h3>Runtime Error</h3>' + 
          '<p>' + message + '</p>' + 
          '<pre>' + (error && error.stack ? error.stack : '') + '</pre>' + 
          '</div>';
      };
      window.addEventListener('unhandledrejection', function(event) {
        document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: sans-serif;">' + 
          '<h3>Unhandled Promise Rejection</h3>' + 
          '<p>' + event.reason + '</p>' + 
          '<pre>' + (event.reason && event.reason.stack ? event.reason.stack : '') + '</pre>' + 
          '</div>';
      });
    </script></head>`
  );
  fs.writeFileSync('index.html', code);
  console.log('Injected error handler');
}
