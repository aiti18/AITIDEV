const portfolioBackLink=document.createElement('a');
portfolioBackLink.className='portfolio-back-link';
portfolioBackLink.href='../../index.html#portfolio';
let portfolioLanguage='en';
try{portfolioLanguage=localStorage.getItem('aitidev-language-v2')==='ru'?'ru':'en'}catch{}
portfolioBackLink.textContent=portfolioLanguage==='ru'?'← Назад':'← Back';
portfolioBackLink.setAttribute('aria-label',portfolioLanguage==='ru'?'Назад на основной сайт':'Back to the main site');
const vantaNav=document.querySelector('.nav');
const vantaLogo=vantaNav?.querySelector('.logo');
if(vantaNav&&vantaLogo){
  const vantaBrandGroup=document.createElement('div');
  vantaBrandGroup.className='nav-brand-group';
  vantaNav.insertBefore(vantaBrandGroup,vantaLogo);
  vantaBrandGroup.append(portfolioBackLink,vantaLogo);
}

const qs=(s,p=document)=>p.querySelector(s),qsa=(s,p=document)=>[...p.querySelectorAll(s)];
qsa('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>{qs('#bookingModal')?.classList.add('open');if(b.dataset.car&&qs('#modalCar'))qs('#modalCar').value=b.dataset.car;}));
qsa('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>b.closest('.modal-backdrop')?.classList.remove('open')));
qsa('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));
const filters=qsa('.filter');filters.forEach(f=>f.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));f.classList.add('active');const t=f.dataset.filter;qsa('.inventory-card').forEach(c=>c.style.display=(t==='all'||c.dataset.type===t)?'block':'none')}));
const search=qs('[data-search]');if(search)search.addEventListener('input',()=>{const q=search.value.toLowerCase();qsa('.inventory-card').forEach(c=>c.style.display=c.innerText.toLowerCase().includes(q)?'block':'none')});
const menu=qs('[data-menu]'),drawer=qs('.mobile-drawer');
const setDrawer=(open)=>{drawer?.classList.toggle('open',open);document.body.classList.toggle('vanta-menu-open',open);menu?.setAttribute('aria-expanded',String(open))};
if(menu&&drawer){menu.setAttribute('aria-label','Open navigation');menu.setAttribute('aria-expanded','false');menu.addEventListener('click',()=>setDrawer(!drawer.classList.contains('open')));const close=document.createElement('button');close.type='button';close.className='mobile-drawer-close';close.setAttribute('aria-label','Close navigation');close.textContent='×';drawer.prepend(close);close.addEventListener('click',()=>setDrawer(false));document.addEventListener('keydown',event=>{if(event.key==='Escape')setDrawer(false)})}
qsa('.mobile-drawer a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));
function days(a,b){if(!a||!b)return 1;return Math.max(1,Math.ceil((new Date(b)-new Date(a))/86400000))}const s=qs('#startDate'),e=qs('#endDate'),t=qs('#bookingTotal');if(s&&e&&t){const p=Number(t.dataset.price||6900),u=()=>t.textContent='AED '+(days(s.value,e.value)*p).toLocaleString('en-US');s.addEventListener('change',u);e.addEventListener('change',u)}
