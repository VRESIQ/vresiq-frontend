const fs=require('fs'), zlib=require('zlib');
const { PDFDocument } = require("../../../vresiq-backend/node_modules/pdf-lib");
(async()=>{
  const path=process.argv[2];
  const doc=await PDFDocument.load(fs.readFileSync(path),{updateMetadata:false});
  console.log('PAGES', doc.getPageCount());
  for(let pi=0; pi<doc.getPageCount(); pi++){
    const page=doc.getPage(pi);
    let contents=page.node.Contents();
    if(!contents) continue;
    const arr = contents.asArray ? contents.asArray() : [contents];
    let stream='';
    for(const ref of arr){
      const obj=doc.context.lookup(ref);
      if(!obj||!obj.contents) continue;
      let raw=Buffer.from(obj.contents);
      const filter=obj.dict?.get?.(doc.context.obj('Filter'))?.toString?.()||'';
      try{ raw=zlib.inflateSync(raw); }catch(e){}
      stream+=raw.toString('latin1');
    }
    // find filled rects: "x y w h re f" or "re ... f"
    const re=/[-0-9.]+ [-0-9.]+ [-0-9.]+ [-0-9.]+ re\s*(f\*?|F)/g;
    let m; const rects=[];
    while((m=re.exec(stream))){
      const nums=m[0].split(/\s+/).slice(0,4).map(Number);
      const [x,y,w,h]=nums;
      if(w>500 && h<=4 && h>0) rects.push({x:+x.toFixed(1),y:+y.toFixed(1),w:+w.toFixed(1),h:+h.toFixed(1),op:m[1]});
    }
    console.log('PAGE',pi+1,'width',page.getWidth(),'height',page.getHeight(),'wide-thin-filled-rects',JSON.stringify(rects));
    // also list color ops near those rects
    for(const r of rects.slice(0,5)){
      const i=stream.indexOf(`${r.x} ${r.y} ${r.w} ${r.h} re`);
      if(i>0) console.log('  context:', JSON.stringify(stream.slice(Math.max(0,i-120), i+60)));
    }
  }
})();
