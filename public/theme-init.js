// Pre-paint theme (external file so the CSP can stay script-src 'self'). Mirrors the theme saved by the app.
try{var t=localStorage.getItem('esl-theme')||'auto';var d=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}
