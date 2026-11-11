const form = document.getElementById('shorten-form');
const longUrl = document.getElementById('long-url');
const custom = document.getElementById('custom-code');
const mode = document.getElementById('mode');

const resultBox = document.getElementById('result');
const shortUrlEl = document.getElementById('short-url');
const copyBtn = document.getElementById('copy-btn');
const openBtn = document.getElementById('open-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    url: longUrl.value.trim(),
    code: custom.value.trim() || undefined,
    mode: mode.value // 'instant' | 'timer'
  };

  try {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to shorten');

    shortUrlEl.textContent = data.shortUrl;
    openBtn.href = data.shortUrl;
    resultBox.classList.remove('hidden');
  } catch (err) {
    alert(err.message);
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shortUrlEl.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
  } catch {
    alert('Copy failed—select and copy manually.');
  }
});
