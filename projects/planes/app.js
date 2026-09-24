
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const id=btn.getAttribute('data-open-modal');
    document.getElementById(id)?.classList.add('open');
  });
});
document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>btn.closest('.modal-backdrop')?.classList.remove('open'));
});
document.querySelectorAll('.modal-backdrop').forEach(bg=>{
  bg.addEventListener('click',e=>{ if(e.target===bg) bg.classList.remove('open'); });
});
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    tab.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
  });
});
const search=document.querySelector('[data-project-search]');
if(search){
  search.addEventListener('input',()=>{
    const q=search.value.toLowerCase();
    document.querySelectorAll('.project-card').forEach(c=>{
      c.style.display=c.textContent.toLowerCase().includes(q)?'':'none';
    });
  });
}

const mobileToggle=document.querySelector('.mobile-top button');
const mobileSidebar=document.querySelector('.sidebar');
if(mobileToggle&&mobileSidebar){
  mobileSidebar.id='planes-mobile-nav';
  mobileToggle.setAttribute('aria-controls',mobileSidebar.id);
  mobileToggle.setAttribute('aria-label','Open navigation');
  mobileToggle.setAttribute('aria-expanded','false');
  const backdrop=document.createElement('button');
  backdrop.type='button';
  backdrop.className='mobile-nav-backdrop';
  backdrop.setAttribute('aria-label','Close navigation');
  const closeButton=document.createElement('button');
  closeButton.type='button';
  closeButton.className='mobile-nav-close';
  closeButton.setAttribute('aria-label','Close navigation');
  closeButton.textContent='×';
  mobileSidebar.prepend(closeButton);
  document.body.append(backdrop);
  const mobileMedia=window.matchMedia('(max-width:760px)');
  const setMobileNav=(open)=>{
    document.body.classList.toggle('mobile-nav-open',open&&mobileMedia.matches);
    mobileToggle.setAttribute('aria-expanded',String(open&&mobileMedia.matches));
    mobileToggle.setAttribute('aria-label',open&&mobileMedia.matches?'Close navigation':'Open navigation');
    mobileSidebar.setAttribute('aria-hidden',String(mobileMedia.matches&&!open));
    mobileSidebar.inert=mobileMedia.matches&&!open;
  };
  mobileToggle.addEventListener('click',()=>setMobileNav(!document.body.classList.contains('mobile-nav-open')));
  backdrop.addEventListener('click',()=>setMobileNav(false));
  closeButton.addEventListener('click',()=>{setMobileNav(false);mobileToggle.focus()});
  mobileSidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMobileNav(false)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setMobileNav(false)});
  if(mobileMedia.addEventListener)mobileMedia.addEventListener('change',()=>setMobileNav(false));
  else mobileMedia.addListener(()=>setMobileNav(false));
  setMobileNav(false);
}
