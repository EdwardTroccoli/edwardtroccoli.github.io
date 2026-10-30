const dialog = document.querySelector('#document-dialog');
const canvas = document.querySelector('#pdf-canvas');
const viewport = document.querySelector('#pdf-viewport');
const status = document.querySelector('#pdf-status');
const pageInput = document.querySelector('#pdf-page');
const prev = document.querySelector('#pdf-prev');
const next = document.querySelector('#pdf-next');
const zoomOut = document.querySelector('#pdf-zoom-out');
const zoomIn = document.querySelector('#pdf-zoom-in');
const fit = document.querySelector('#pdf-fit');
let libraryPromise, loadingTask, pdf, renderTask, activeId = 0;
let pageNumber = 1, zoom = 1, busy = false, returnFocus;

function controls(disabled) {
  pageInput.disabled = disabled;
  prev.disabled = disabled || pageNumber <= 1;
  next.disabled = disabled || !pdf || pageNumber >= pdf.numPages;
  zoomOut.disabled = disabled || zoom <= .5;
  zoomIn.disabled = disabled || zoom >= 2.5;
  fit.disabled = disabled;
}
function showStatus(message) { status.hidden = false; status.textContent = message; }
async function getLibrary() {
  if (!libraryPromise) libraryPromise = import('./vendor/pdf.min.mjs').then(lib => {
    lib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
    return lib;
  });
  return libraryPromise;
}
async function renderPage() {
  if (!pdf || busy) return;
  busy = true;
  controls(true);
  const id = activeId;
  try {
    showStatus('Loading page ' + pageNumber + '…');
    const page = await pdf.getPage(pageNumber);
    if (id !== activeId) return;
    const base = page.getViewport({scale:1});
    const scale = Math.max(150, viewport.clientWidth - 32) / base.width * zoom;
    const view = page.getViewport({scale});
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(view.width * pixelRatio);
    canvas.height = Math.floor(view.height * pixelRatio);
    canvas.style.width = Math.floor(view.width) + 'px';
    canvas.style.height = Math.floor(view.height) + 'px';
    canvas.hidden = false;
    renderTask = page.render({canvasContext:canvas.getContext('2d'), viewport:view, transform:pixelRatio === 1 ? null : [pixelRatio,0,0,pixelRatio,0,0]});
    await renderTask.promise;
    if (id !== activeId) return;
    status.hidden = true;
    pageInput.value = pageNumber;
    canvas.setAttribute('aria-label', 'Page ' + pageNumber + ' of ' + pdf.numPages);
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
    const text = await page.getTextContent();
    if (id === activeId) document.querySelector('#pdf-page-text').textContent = 'Page ' + pageNumber + '. ' + text.items.map(item => item.str).join(' ');
  } catch (error) {
    if (id === activeId && error.name !== 'RenderingCancelledException') showStatus('This page could not be displayed. You can open or download the original PDF above.');
  } finally {
    if (id === activeId) { busy = false; controls(!pdf); }
  }
}
async function openDocument(button) {
  const id = ++activeId;
  returnFocus = button;
  pageNumber = 1; zoom = 1; busy = false; pdf = null;
  const url = new URL(button.dataset.document, document.baseURI);
  const title = button.dataset.title || 'Project document';
  document.querySelector('#document-reader-title').textContent = title;
  document.querySelector('#document-open-file').href = url.href;
  document.querySelector('#document-save-file').href = url.href;
  document.querySelector('#pdf-page-text').textContent = '';
  document.querySelector('#pdf-page-count').textContent = 'of —';
  pageInput.value = 1;
  canvas.hidden = true;
  showStatus('Loading document…');
  controls(true);
  dialog.showModal();
  try {
    const lib = await getLibrary();
    if (id !== activeId) return;
    loadingTask = lib.getDocument({url:url.href, cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href, cMapPacked:true, standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href, wasmUrl:new URL('./vendor/wasm/',import.meta.url).href, isEvalSupported:false});
    const loaded = await loadingTask.promise;
    if (id !== activeId) { loaded.destroy(); return; }
    pdf = loaded;
    pageInput.max = pdf.numPages;
    document.querySelector('#pdf-page-count').textContent = 'of ' + pdf.numPages;
    await renderPage();
  } catch (_) {
    if (id === activeId) showStatus('The preview could not be loaded. Please open or download the original PDF using the links above.');
  }
}
document.querySelectorAll('[data-document]').forEach(button => button.addEventListener('click', () => openDocument(button)));
document.querySelector('.document-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  activeId += 1;
  renderTask?.cancel();
  loadingTask?.destroy().catch(() => {});
  loadingTask = null; pdf = null; busy = false;
  canvas.width = 0; canvas.height = 0;
  returnFocus?.focus();
});
prev.addEventListener('click', () => { if (pageNumber > 1 && !busy) { pageNumber -= 1; renderPage(); } });
next.addEventListener('click', () => { if (pdf && pageNumber < pdf.numPages && !busy) { pageNumber += 1; renderPage(); } });
pageInput.addEventListener('change', () => { if (pdf && !busy) { pageNumber = Math.max(1, Math.min(pdf.numPages, Number.parseInt(pageInput.value,10) || 1)); renderPage(); } });
zoomOut.addEventListener('click', () => { if (!busy) { zoom = Math.max(.5, zoom - .25); renderPage(); } });
zoomIn.addEventListener('click', () => { if (!busy) { zoom = Math.min(2.5, zoom + .25); renderPage(); } });
fit.addEventListener('click', () => { if (!busy) { zoom = 1; renderPage(); } });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (dialog.open && pdf && !busy) renderPage(); },150); });
