
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.getElementById(btn.dataset.openModal)?.classList.add('open');
  });
});
document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>btn.closest('.modal-backdrop')?.classList.remove('open'));
});
document.querySelectorAll('.modal-backdrop').forEach(bg=>{
  bg.addEventListener('click',e=>{if(e.target===bg) bg.classList.remove('open')});
});
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    tab.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
  });
});
const patientSearch=document.querySelector('[data-patient-search]');
if(patientSearch){
  patientSearch.addEventListener('input',()=>{
    const q=patientSearch.value.toLowerCase();
    document.querySelectorAll('.patient-card').forEach(card=>{
      card.style.display=card.innerText.toLowerCase().includes(q)?'block':'none';
    });
  });
}
const send=document.querySelector('[data-send]');
if(send){
  send.addEventListener('click',()=>{
    const input=document.querySelector('[data-chat-input]');
    const box=document.querySelector('.messages');
    if(input && input.value.trim()){
      const div=document.createElement('div');
      div.className='msg me';
      div.textContent=input.value.trim();
      box.appendChild(div); input.value=''; box.scrollTop=box.scrollHeight;
    }
  });
}
document.querySelectorAll('.component').forEach(c=>{
  c.addEventListener('click',()=>{
    const target=document.querySelector('.builder-canvas');
    if(target){
      const d=document.createElement('div');
      d.className='canvas-block';
      d.innerHTML='<b>'+c.dataset.label+'</b><p class="muted" style="font-size:10px;margin:5px 0 0">New calculator component</p>';
      target.insertBefore(d,target.querySelector('.price-summary'));
    }
  });
});

const mobileToggle=document.querySelector('.mobile-head button');
const mobileSidebar=document.querySelector('.sidebar');
if(mobileToggle&&mobileSidebar){
  mobileSidebar.id='dentaland-mobile-nav';
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
  const mobileMedia=window.matchMedia('(max-width:820px)');
  const setMobileNav=(open)=>{
    document.body.classList.toggle('mobile-nav-open',open&&mobileMedia.matches);
    mobileToggle.setAttribute('aria-expanded',String(open&&mobileMedia.matches));
    mobileToggle.setAttribute('aria-label',open&&mobileMedia.matches?'Close navigation':'Open navigation');
    mobileSidebar.setAttribute('aria-hidden',String(mobileMedia.matches&&!open));
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
