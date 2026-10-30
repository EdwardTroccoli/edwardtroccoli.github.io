(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-button');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeButton) {
      const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      themeButton.setAttribute('aria-label', label);
      themeButton.title = label;
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#182124' : '#faf9f6');
  }
  let initialTheme = 'light';
  try { initialTheme = localStorage.getItem('edward-theme') || 'light'; } catch (_) {}
  applyTheme(initialTheme === 'dark' ? 'dark' : 'light');
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('edward-theme', next); } catch (_) {}
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  const researchRows = document.querySelectorAll('[data-field]');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let shown = 0;
    researchRows.forEach(row => {
      row.hidden = button.dataset.filter !== 'all' && row.dataset.field !== button.dataset.filter;
      if (!row.hidden) shown += 1;
    });
    const status = document.querySelector('.filter-status');
    if (status) status.textContent = `${shown} research project${shown === 1 ? '' : 's'} shown.`;
  }));

  const dialog = document.querySelector('#citation-dialog');
  document.querySelector('#citation-open')?.addEventListener('click', () => dialog.showModal());
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog?.addEventListener('close', () => { document.querySelector('#copy-status').textContent = ''; });
  document.querySelector('#citation-copy')?.addEventListener('click', async () => {
    const text = document.querySelector('#bibtex').textContent;
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector('#copy-status').textContent = 'Copied to clipboard.';
    } catch (_) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#bibtex'));
      selection.removeAllRanges();
      selection.addRange(range);
      document.querySelector('#copy-status').textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
    }
  });
  document.querySelector('#print-cv')?.addEventListener('click', () => window.print());

  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [...navLinks].map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-12% 0px -60% 0px', threshold:0});
    sections.forEach(section => observer.observe(section));
  }
})();
