const { PDFDocument, PDFName, PDFString } = require('../../../vresiq-backend/node_modules/pdf-lib');
const fs = require('fs');
(async () => {
  const doc = await PDFDocument.load(fs.readFileSync(process.argv[2]));
  const out = [];
  for (const page of doc.getPages()) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i++) {
      const a = annots.lookup(i);
      const action = a.lookup(PDFName.of('A'));
      if (!action) continue;
      const uri = action.lookup(PDFName.of('URI'));
      if (uri) out.push(uri.toString().replace(/^\(|\)$/g, ''));
    }
  }
  console.log('PAGES', doc.getPageCount(), 'LINKS', JSON.stringify(out));
})();
