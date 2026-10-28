(() => {
'use strict';
const project = window.LUO_PROJECT, imagePath = window.LUO_IMAGE;
const coverPath = id => `assets/covers/art-${String(id).padStart(2,'0')}.webp`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const collectionDialog = document.querySelector('#collection-dialog');
const viewer = document.querySelector('#viewer'), grid = document.querySelector('#collection-grid');
const film = document.querySelector('#project-film'), playFilm = document.querySelector('#play-film');
const coverButton = document.querySelector('#pause-covers');
let collection = null, active = 0, collectionOpener = null, imageOpener = null;
let coverStep = 0, coversPaused = reduced.matches, coversVisible = false, coverTimer = 0;
const cached = new Map();
function preload(id) {
 if (!cached.has(id)) {
  const im = new Image(); im.decoding='async'; im.fetchPriority='low';
  const entry={image:im,ready:false}; cached.set(id,entry);
  im.onload=async()=>{try{await im.decode();entry.ready=true;}catch{cached.delete(id);}};
  im.onerror=()=>cached.delete(id); im.src=coverPath(id);
 }
 return cached.get(id);
}
const characterCategory=project.categories.find(category=>category.id==='characters');
const characterGroups=characterCategory.collections.map(id=>project.collections.find(group=>group.id===id));
const characterCard={...characterCategory,children:characterGroups,images:characterGroups.flatMap(group=>group.images)};
const topLevelGroups=['environment','characters','props'].map(id=>id==='characters'?characterCard:project.collections.find(group=>group.id===id));
const backCategory=document.querySelector('#back-category');
let categoryOpener=null;
function createCollectionCard(group, nested=false){
 const card = document.createElement('button'); card.className = 'collection-card';
 card.dataset.collection=group.id;
 card.setAttribute('aria-label',group.children?`打开${group.title}，共 ${group.children.length} 个图集，${group.images.length} 张图片`:`打开${group.title}图集，共 ${group.images.length} 张图片`);
 card.innerHTML = `<div class="cover"><img class="active" ${nested?'src':'data-src'}="${coverPath(group.images[0])}" alt="${group.title}封面" decoding="async"><img alt="" aria-hidden="true" decoding="async"><span class="collection-arrow" aria-hidden="true">↗</span><span class="cover-count">01 / ${String(group.images.length).padStart(2,'0')}</span></div><div class="collection-caption"><h4>${group.title}</h4><span>${group.children?`${group.children.length} COLLECTIONS`:`${String(group.images.length).padStart(2,'0')} IMAGES`}</span></div><span class="collection-type">${group.en}</span>`;
 card.addEventListener('click',()=>group.children?openCategory(card):openCollection(group,card,nested));
 return card;
}
const cards = topLevelGroups.map(group => {
 const card=createCollectionCard(group);
 document.querySelector('#collections').append(card);
 return {card,group,front:0,images:card.querySelectorAll('.cover img')};
});
// One clock: every cover changes in the same tick, every five seconds.
function rotateCovers(){
 const next = coverStep+1;
 const pending=cards.map(({group})=>preload(group.images[next%group.images.length]));
 if(!pending.every(entry=>entry.ready)) return;
 coverStep=next;
 cards.forEach(state=>{
  const {group,images,card}=state, index=coverStep%group.images.length, back=1-state.front;
  images[back].src=coverPath(group.images[index]); images[back].alt=`${group.title}封面 ${index+1}`;
  images[back].removeAttribute('aria-hidden'); images[back].classList.add('active');
  images[state.front].classList.remove('active'); images[state.front].setAttribute('aria-hidden','true');
  state.front=back;
  card.querySelector('.cover-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(group.images.length).padStart(2,'0')}`;
  preload(group.images[(coverStep+1)%group.images.length]);
 });
}
function syncCovers(){
 const running=coversVisible&&!coversPaused&&!document.hidden&&!collectionDialog.open;
 if(!running){clearInterval(coverTimer);coverTimer=0;return;}
 cards.forEach(({group})=>preload(group.images[(coverStep+1)%group.images.length]));
 if(!coverTimer)coverTimer=setInterval(rotateCovers,5000);
}
const coverLoader=new IntersectionObserver(entries=>{
 if(!entries[0].isIntersecting)return;
 cards.forEach(({images})=>{images[0].src=images[0].dataset.src;});coverLoader.disconnect();
},{rootMargin:'250px 0px'});
coverLoader.observe(document.querySelector('#collections'));
new IntersectionObserver(entries=>{coversVisible=entries[0].isIntersecting;syncCovers();}).observe(document.querySelector('#collections'));
const posterLoader=new IntersectionObserver(entries=>{
 if(!entries[0].isIntersecting)return;
 film.poster=project.poster;posterLoader.disconnect();
},{rootMargin:'300px 0px'});
posterLoader.observe(film);
function syncCoverButton(){
 coverButton.setAttribute('aria-pressed',String(coversPaused));
 coverButton.textContent=coversPaused?'继续封面轮播 ▷':'暂停封面轮播 Ⅱ';
}
coverButton.addEventListener('click',()=>{
 coversPaused=!coversPaused;syncCoverButton();
 syncCovers();
});
syncCoverButton();
function openCategory(opener=categoryOpener,focusId=null){
 categoryOpener=opener;collectionOpener=opener;collection=null;film.pause();
 backCategory.hidden=true;
 document.querySelector('#collection-title').textContent=characterCard.title;
 document.querySelector('#collection-label').textContent='沙谕 AIGC / CHARACTER DESIGN';
 document.querySelector('#collection-info').textContent=`5 个图集 · ${characterCard.images.length} 张参考图片`;
 grid.replaceChildren();grid.classList.add('category-grid');
 characterGroups.forEach(group=>grid.append(createCollectionCard(group,true)));
 if(!collectionDialog.open)collectionDialog.showModal();
 document.body.classList.add('modal-open');collectionDialog.scrollTop=0;
 syncCovers();syncAnimation();
 const focusCard=focusId?grid.querySelector(`[data-collection="${focusId}"]`):null;
 (focusCard||document.querySelector('#close-collection')).focus();
}
backCategory.addEventListener('click',()=>openCategory(categoryOpener,collection?.id));
collectionDialog.addEventListener('cancel',event=>{
 if(event.target===collectionDialog&&!backCategory.hidden){event.preventDefault();openCategory(categoryOpener,collection?.id);}
});
function openCollection(group,opener,nested=false){
 collection=group; if(!nested)collectionOpener=opener; film.pause();
 backCategory.hidden=!nested;
 document.querySelector('#collection-title').textContent=group.title;
 document.querySelector('#collection-label').textContent=`沙谕 AIGC / ${group.en}`;
 document.querySelector('#collection-info').textContent=`${group.images.length} 张参考图片 · 点击任意图片放大查看`;
 grid.replaceChildren();grid.classList.remove('category-grid');
 group.images.forEach((id,index)=>{
  const button=document.createElement('button');button.className='collection-item';
  button.setAttribute('aria-label',`放大${group.title}第 ${index+1} 张图片`);
  button.innerHTML=`<img src="${imagePath(id)}" alt="${group.title}参考图 ${index+1}" loading="lazy" decoding="async"><span>${String(index+1).padStart(2,'0')} / ${group.en}</span>`;
  button.addEventListener('click',()=>{imageOpener=button;openImage(index);});grid.append(button);
 });
 document.body.classList.add('modal-open');if(!collectionDialog.open)collectionDialog.showModal();collectionDialog.scrollTop=0;
 syncCovers();syncAnimation();
 document.querySelector('#close-collection').focus();
}
document.querySelector('#close-collection').addEventListener('click',()=>collectionDialog.close());
collectionDialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');collectionOpener?.focus();syncCovers();syncAnimation();});
function openImage(index){
 active=(index+collection.images.length)%collection.images.length;
 const im=new Image();im.src=imagePath(collection.images[active]);im.alt=`${collection.title}参考图 ${active+1}`;
 document.querySelector('#viewer-media').replaceChildren(im);
 document.querySelector('#viewer-title').textContent=collection.title;
 document.querySelector('#viewer-index').textContent=`${String(active+1).padStart(2,'0')} / ${String(collection.images.length).padStart(2,'0')}`;
 if(!viewer.open){viewer.showModal();document.querySelector('#close-viewer').focus();}
}
document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());
viewer.addEventListener('close',()=>imageOpener?.focus());
document.querySelector('#prev-work').addEventListener('click',()=>openImage(active-1));
document.querySelector('#next-work').addEventListener('click',()=>openImage(active+1));
viewer.addEventListener('keydown',event=>{
 if(event.key==='ArrowLeft'){event.preventDefault();openImage(active-1);}
 if(event.key==='ArrowRight'){event.preventDefault();openImage(active+1);}
});
playFilm.addEventListener('click',()=>film.play().catch(()=>{playFilm.hidden=true;film.focus();}));
film.addEventListener('play',()=>{playFilm.hidden=true;});
film.addEventListener('ended',()=>{playFilm.hidden=false;});

// Diagonal travel and edge reflection, with a short, separated image trail.
// The wordmark masks a second, monochrome photographic layer. No color inversion.
const hero=document.querySelector('.hero'),canvas=document.querySelector('#trail');
const ctx=canvas.getContext('2d'),pause=document.querySelector('#pause');
const letterCanvas=document.querySelector('#letter-image'),letterCtx=letterCanvas.getContext('2d');
const wordmark=document.querySelector('.hero h1');
const textMask=document.createElement('canvas'),maskCtx=textMask.getContext('2d');
const grain=document.createElement('canvas');grain.width=grain.height=192;
const grainCtx=grain.getContext('2d'),grainPixels=grainCtx.createImageData(192,192);
// Stable fine grain: no frame-to-frame flicker and no reads from local image pixels.
let grainSeed=137;
for(let i=0;i<grainPixels.data.length;i+=4){
 grainSeed=(Math.imul(grainSeed,1664525)+1013904223)>>>0;
 const value=grainSeed>>>24;
 grainPixels.data[i]=grainPixels.data[i+1]=grainPixels.data[i+2]=value;
 grainPixels.data[i+3]=255;
}
grainCtx.putImageData(grainPixels,0,0);
const grainPattern=letterCtx.createPattern(grain,'repeat');
const sources=[1,2,3,4,5].map(id=>`assets/hero/hero-${String(id).padStart(2,'0')}.webp`);
const images=sources.map(()=>new Image()),monochrome=[],heroLoads=[];
// Decode one image at a time, with the first image taking network priority.
function loadHero(index){
 if(heroLoads[index])return heroLoads[index];
 const im=images[index];im.decoding='async';im.fetchPriority=index===0?'high':'low';
 heroLoads[index]=new Promise(resolve=>{
  im.onload=async()=>{
   try{await im.decode();}catch{/* A loaded image can still be drawn. */}
   const mono=document.createElement('canvas');mono.width=im.naturalWidth;mono.height=im.naturalHeight;
   const monoCtx=mono.getContext('2d');
   // Apply the photographic grade once per source, never to the full viewport per frame.
   monoCtx.filter='grayscale(1) contrast(1.65) brightness(0.88)';
   monoCtx.drawImage(im,0,0);monochrome[index]=mono;
   if(index===selected){clampPosition();draw();}syncAnimation();resolve(true);
  };
  im.onerror=()=>{heroLoads[index]=null;resolve(false);};im.src=sources[index];
 });
 return heroLoads[index];
}
async function warmHero(){
 if(!monochrome[0]||!onScreen||document.hidden||collectionDialog.open)return;
 if(heroLoads.some((load,i)=>load&&!monochrome[i]))return;
 const next=images.findIndex((im,i)=>!monochrome[i]&&!heroLoads[i]);
 if(next!==-1&&await loadHero(next))setTimeout(warmHero,150);
}
let selected=0,width=0,height=0,x=0,y=0,dx=1,dy=1,elapsed=0,lastTime=0,trailClock=0;
let paused=reduced.matches,onScreen=false,covered=false,raf=0,lastPaint=0;
let letterTop=0,letterBottom=0;
const trails=[];
const trailLifetime=4,trailOpacity=.45,trailInterval=.25;
// Keep the full four-second history at four stamps per second.
const trailLimit=Math.ceil(trailLifetime/trailInterval);
function dimensions(index=selected){
 const im=images[index];
 const maxW=Math.min(width*.37,340),maxH=Math.min(height*.45,375);
 const scale=Math.min(maxW/(im.naturalWidth||1),maxH/(im.naturalHeight||1));
 return {w:(im.naturalWidth||1)*scale,h:(im.naturalHeight||1)*scale};
}
function bounds(){const {w,h}=dimensions();return {rx:Math.max(0,(width-w)/2-12),ry:Math.max(0,(height-h)/2-10)};}
function clampPosition(){const {rx,ry}=bounds();x=Math.max(-rx,Math.min(rx,x));y=Math.max(-ry,Math.min(ry,y));}
function changeImage(preserveRelative=true){
 const nextIndex=(selected+1)%images.length;
 if(!monochrome[nextIndex]){loadHero(nextIndex).then(ok=>{if(ok&&selected===(nextIndex+images.length-1)%images.length){changeImage(preserveRelative);draw();}});return;}
 const old=bounds();selected=(selected+1)%images.length;const next=bounds();
 if(preserveRelative){x=old.rx?x/old.rx*next.rx:0;y=old.ry?y/old.ry*next.ry:0;}
 clampPosition();document.querySelector('#image-count').textContent=`${String(selected+1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
}
function stamp(){
 const im=images[selected];if(!im.complete||!im.naturalWidth)return;
 trails.push({x,y,index:selected,at:elapsed,...dimensions()});
 while(trails.length>trailLimit)trails.shift();
}
function drawImage(index,px,py,w,h,opacity){
 const im=images[index];if(!im.complete||!im.naturalWidth)return;
 ctx.globalAlpha=opacity;ctx.drawImage(im,width/2+px-w/2,height/2+py-h/2,w,h);
 const top=height/2+py-h/2;
 if(monochrome[index]&&top+h>letterTop&&top<letterBottom){
  letterCtx.globalAlpha=opacity;letterCtx.drawImage(monochrome[index],width/2+px-w/2,top,w,h);
 }
}
let wordmarkInk=null;
// Reuse the rendered glyph mask so holes and spaces do not trigger inversion.
wordmark.containsInkAt=(clientX,clientY)=>{
 if(!wordmarkInk||!width||!height)return false;
 const rect=hero.getBoundingClientRect();
 const px=Math.floor((clientX-rect.left)*textMask.width/width);
 const py=Math.floor((clientY-rect.top)*textMask.height/height);
 return px>=0&&py>=0&&px<textMask.width&&py<textMask.height&&wordmarkInk[py*textMask.width+px]>32;
};
function updateTextMask(){
 const style=getComputedStyle(wordmark),heroRect=hero.getBoundingClientRect();
 const rect=wordmark.getBoundingClientRect();
 // Include glyph ink that extends above the tightly spaced h1 line box.
 letterTop=Math.max(0,rect.top-heroRect.top-parseFloat(style.fontSize)*.25);
 letterBottom=Math.min(height,rect.bottom-heroRect.top+20);
 const baseline=document.querySelector('#wordmark-baseline').getBoundingClientRect().top-heroRect.top;
 const dpr=canvas.width/width;
 const scaleX=style.transform==='none'?1:new DOMMatrixReadOnly(style.transform).a;
 maskCtx.clearRect(0,0,textMask.width,textMask.height);
 maskCtx.save();
 maskCtx.setTransform(dpr*scaleX,0,0,dpr,(rect.left-heroRect.left)*dpr,baseline*dpr);
 maskCtx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
 maskCtx.textBaseline='alphabetic';maskCtx.fillStyle='#fff';
 const label=wordmark.firstChild.textContent;
 if('letterSpacing' in maskCtx){maskCtx.letterSpacing=style.letterSpacing;maskCtx.fillText(label,0,0);}
 else{
  const spacing=parseFloat(style.letterSpacing)||0;
  for(let i=0;i<label.length;i++)maskCtx.fillText(label[i],maskCtx.measureText(label.slice(0,i)).width+i*spacing,0);
 }
 maskCtx.restore();
 const pixels=maskCtx.getImageData(0,0,textMask.width,textMask.height).data;
 wordmarkInk=new Uint8Array(textMask.width*textMask.height);
 for(let i=0;i<wordmarkInk.length;i++)wordmarkInk[i]=pixels[i*4+3];
}
function drawMonochromeLetters(){
 letterCtx.save();
 // source-atop keeps grain inside the image alpha, including fading trail images.
 letterCtx.globalCompositeOperation='source-atop';
 letterCtx.globalAlpha=.075;letterCtx.fillStyle=grainPattern;
 letterCtx.fillRect(0,letterTop,width,letterBottom-letterTop);
 letterCtx.globalAlpha=1;letterCtx.globalCompositeOperation='destination-in';
 letterCtx.drawImage(textMask,0,0,width,height);
 letterCtx.restore();
}
function draw(){
 if(!width||!height)return;
 ctx.clearRect(0,0,width,height);
 letterCtx.clearRect(0,0,width,height);letterCtx.save();
 letterCtx.beginPath();letterCtx.rect(0,letterTop,width,Math.max(0,letterBottom-letterTop));letterCtx.clip();
 if(!reduced.matches)trails.forEach(t=>{const age=elapsed-t.at;const alpha=trailOpacity*Math.max(0,1-age/trailLifetime);drawImage(t.index,t.x,t.y,t.w,t.h,alpha);});
 const {w,h}=dimensions();drawImage(selected,x,y,w,h,1);ctx.globalAlpha=1;
 drawMonochromeLetters();
 letterCtx.restore();
}
function resize(){
 const oldW=width,oldH=height;width=hero.clientWidth;height=hero.clientHeight;
 if(oldW&&oldH){x*=width/oldW;y*=height/oldH;}trails.length=0;
 // Bound backing-store memory on large / high-DPI monitors (three canvas buffers).
 const dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(4000000/(width*height)));
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 letterCanvas.width=textMask.width=canvas.width;letterCanvas.height=textMask.height=canvas.height;
 ctx.setTransform(dpr,0,0,dpr,0,0);letterCtx.setTransform(dpr,0,0,dpr,0,0);
 updateTextMask();clampPosition();draw();
}
function clickChange(){changeImage();draw();}
function syncPause(){pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-label',paused?'播放首屏动效':'暂停首屏动效');}
document.querySelector('#next-art').addEventListener('click',clickChange);
hero.addEventListener('click',event=>{if(!event.target.closest('a,button'))clickChange();});
pause.addEventListener('click',()=>{paused=!paused;syncPause();syncAnimation();});
reduced.addEventListener('change',()=>{paused=coversPaused=reduced.matches;trails.length=0;syncPause();syncCoverButton();syncCovers();syncAnimation();draw();});
new ResizeObserver(()=>{if(width!==hero.clientWidth||height!==hero.clientHeight)resize();}).observe(hero);
new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;syncAnimation();if(onScreen)warmHero();}).observe(hero);
hero.addEventListener('hero-occlusion',event=>{covered=event.detail.covered;syncAnimation();});
function canAnimate(){return !paused&&onScreen&&!covered&&!document.hidden&&!collectionDialog.open&&!!monochrome[selected];}
function syncAnimation(){
 if(canAnimate()){if(!raf){lastTime=lastPaint=0;raf=requestAnimationFrame(frame);}}
 else{cancelAnimationFrame(raf);raf=0;lastTime=lastPaint=0;}
}
document.addEventListener('visibilitychange',()=>{syncAnimation();syncCovers();if(!document.hidden)warmHero();});
function frame(time){
 raf=0;if(!canAnimate())return;
 // High-refresh displays retain the same speed without redrawing at 120/144 Hz.
 const interval=1000/60,sincePaint=time-lastPaint;
 if(lastPaint&&sincePaint<interval-.5){raf=requestAnimationFrame(frame);return;}
 const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;
 lastPaint=time-(lastPaint?Math.max(0,sincePaint-interval)%interval:0);
  elapsed+=dt;
  // Preserve four stamps per second with about 51px between diagonal copies.
  const speed=144*(.5-Math.cos(Math.min(elapsed,1)*Math.PI)/2);
  x+=speed*dx*dt;y+=speed*dy*dt;
  const {rx,ry}=bounds();
  const hitX=(x>=rx&&dx>0)||(x<=-rx&&dx<0),hitY=(y>=ry&&dy>0)||(y<=-ry&&dy<0);
  if(hitX||hitY){if(hitX)dx*=-1;if(hitY)dy*=-1;changeImage(false);}
  clampPosition();trailClock+=dt;if(trailClock>=trailInterval){stamp();trailClock%=trailInterval;}
  while(trails.length&&elapsed-trails[0].at>trailLifetime)trails.shift();draw();
 raf=requestAnimationFrame(frame);
}
syncPause();resize();document.fonts.ready.then(()=>{updateTextMask();draw();});
loadHero(0).then(()=>setTimeout(warmHero,150));
})();
