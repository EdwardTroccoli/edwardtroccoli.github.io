# Edward Troccoli — personal website

A static academic website for Edward Troccoli. Intended public address: https://edwardtroccoli.github.io/

## Edit

- `index.html`: biography, research, publication, documents and contact details.
- `cv.html`: CV and print-to-PDF view.
- `assets/style.css`: colours, fonts, layout and print styling.
- `assets/site.js`: themes, research filters and publication citation.
- `assets/pdf-reader.js`: the embedded PDF reader.
- `documents/`: thesis, research manuscript, reports and presentation.
- `papers/`: published research paper.

Keep the folders together; the website uses relative paths.

## Preview

From this repository folder, run `python3 -m http.server 4173`, then open http://localhost:4173/.

## Publish

In this repository's Settings > Pages, choose Deploy from a branch, the default branch (normally main), and / (root). Keep `.nojekyll` at the repository root. Subsequent changes committed to the publishing branch update the website.

## Documents and licences

The 2025 quantum-control document is a research manuscript, listed separately from the peer-reviewed MNRAS publication. A student number was removed from the website copy of the manuscript. The supplied originals were not altered. The fibre reference presentation does not specify a project year.

The embedded reader uses Mozilla PDF.js, licensed under Apache 2.0. See `assets/vendor/PDFJS-LICENSE.txt` and accompanying font/support licences. The reader loads locally hosted scripts, fonts and character maps only when a document is opened.
