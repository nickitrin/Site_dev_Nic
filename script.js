document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Atualiza botões ativos e atributos ARIA para acessibilidade
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            const filterValue = btn.dataset.filter;

            // Filtra os cards adicionando/removendo classe 'is-hidden' e controlando aria-hidden
            cards.forEach(card => {
                const cardCategory = card.dataset.category;
                const matches = (filterValue === 'all' || filterValue === cardCategory);
                if (matches) {
                    card.classList.remove('is-hidden');
                    card.setAttribute('aria-hidden', 'false');
                } else {
                    card.classList.add('is-hidden');
                    card.setAttribute('aria-hidden', 'true');
                }
            });
        });
    });

    // Keyboard navigation for filter tabs
    const filtersContainer = document.querySelector('.filters');
    if(filtersContainer){
        filtersContainer.addEventListener('keydown', (e)=>{
            const focusable = Array.from(filtersContainer.querySelectorAll('.filter-btn'));
            const idx = focusable.indexOf(document.activeElement);
            if(e.key === 'ArrowRight') { e.preventDefault(); const next = focusable[idx+1] || focusable[0]; next.focus(); }
            if(e.key === 'ArrowLeft') { e.preventDefault(); const prev = focusable[idx-1] || focusable[focusable.length-1]; prev.focus(); }
            if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement.click(); }
        });
    }

    /* Carousel behaviour */
    const track = document.querySelector('.carousel-track');
    if(track){
        const prev = document.querySelector('.carousel-prev');
        const next = document.querySelector('.carousel-next');
        const cardsVisible = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--visible-count'))||2;
        let index = 0;
        const GAP = 12; // must match CSS gap

        function visibleItems(){ return Array.from(track.children).filter(c=>!c.classList.contains('is-hidden')); }

        function firstVisibleWidth(){
            const v = visibleItems();
            if(v.length===0) return 0;
            return v[0].offsetWidth;
        }

        function update(){
            const v = visibleItems();
            const totalVisible = v.length;
            const maxIndex = Math.max(0, totalVisible - cardsVisible);
            if(index > maxIndex) index = maxIndex;
            if(index < 0) index = 0;
            const w = firstVisibleWidth();
            const offset = index * (w + GAP);
            track.style.transform = `translateX(-${offset}px)`;
            // update disabled state
            if(prev) { prev.disabled = index === 0; prev.setAttribute('aria-disabled', prev.disabled); }
            if(next) { next.disabled = index >= maxIndex; next.setAttribute('aria-disabled', next.disabled); }
        }

        prev && prev.addEventListener('click', ()=>{ index = Math.max(0, index - cardsVisible); update(); });
        next && next.addEventListener('click', ()=>{ index = Math.min(Math.max(0, visibleItems().length - cardsVisible), index + cardsVisible); update(); });
        // Make track keyboard focusable and allow arrow navigation
        track.setAttribute('tabindex','0');
        track.addEventListener('keydown', (e)=>{
            if(e.key === 'ArrowLeft') { index = Math.max(0, index - 1); update(); }
            if(e.key === 'ArrowRight') { index = Math.min(Math.max(0, visibleItems().length - cardsVisible), index + 1); update(); }
        });

        // Reset carousel when filters change: observe mutations to classes of cards inside the track
        const observer = new MutationObserver(()=>{ index = 0; update(); });
        observer.observe(track, { subtree: true, attributes: true, attributeFilter: ['class'] });
        // also update on load
        setTimeout(update, 100);
    }
});

// Verificador simples de acessibilidade (roda no navegador)
(function(){
    function parseRGB(str){
        const m = str.match(/rgba?\(([^)]+)\)/);
        if(!m) return null;
        return m[1].split(',').slice(0,3).map(s=>parseInt(s.trim(),10));
    }
    function srgbToLin(c){ c = c/255; return c<=0.03928? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
    function luminance(rgb){ return 0.2126*srgbToLin(rgb[0]) + 0.7152*srgbToLin(rgb[1]) + 0.0722*srgbToLin(rgb[2]); }
    function contrastRatio(colA, colB){
        const la = luminance(colA); const lb = luminance(colB);
        const L1 = Math.max(la,lb), L2 = Math.min(la,lb);
        return (L1+0.05)/(L2+0.05);
    }

    const issues = [];

    // Skip link
    if(!document.querySelector('.skip-link')) issues.push({type:'error', message:'Adicionar link "Ir para o conteúdo" (skip link)'});

    // Filters ARIA
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    if(filterBtns.length===0) issues.push({type:'warn', message:'Nenhum botão de filtro detectado'});
    else {
        const missing = filterBtns.filter(b=>!b.hasAttribute('aria-pressed'));
        if(missing.length>0) issues.push({type:'warn', message:`${missing.length} botão(ões) sem atributo aria-pressed`});
    }

    // Images without alt
    const imgs = Array.from(document.querySelectorAll('img'));
    const imgsNoAlt = imgs.filter(i=>!i.hasAttribute('alt') || i.getAttribute('alt').trim()==='');
    if(imgsNoAlt.length>0) issues.push({type:'warn', message:`${imgsNoAlt.length} imagem(ns) sem atributo alt`});

    // Contrast checks: body text vs background
    try{
        const body = getComputedStyle(document.body);
        const bodyColor = parseRGB(body.color);
        const bodyBg = parseRGB(body.backgroundColor) || [255,255,255];
        if(bodyColor && bodyBg){
            const ratio = contrastRatio(bodyColor, bodyBg);
            if(ratio < 4.5) issues.push({type:'error', message:`Contraste do texto principal baixo (${ratio.toFixed(2)}:1)`});
        }
    }catch(e){}

    // Buttons contrast
    const btn = document.querySelector('.btn');
    if(btn){
        const s = getComputedStyle(btn);
        const fg = parseRGB(s.color) || [255,255,255];
        const bg = parseRGB(s.backgroundColor) || [122,59,73];
        try{
            const r = contrastRatio(fg,bg);
            if(r < 3) issues.push({type:'warn', message:`Baixo contraste no botão (${r.toFixed(2)}:1)`});
        }catch(e){}
    }

    // Build panel
    const panel = document.createElement('div'); panel.className='a11y-report';
    const title = document.createElement('h4'); title.textContent='A11Y — Verificação rápida';
    const close = document.createElement('button'); close.className='a11y-close'; close.textContent='Fechar';
    close.addEventListener('click', ()=>panel.remove());
    title.appendChild(close);
    panel.appendChild(title);
    const list = document.createElement('ul');
    if(issues.length===0){ const ok = document.createElement('div'); ok.textContent='Nenhum problema rápido detectado.'; panel.appendChild(ok); }
    else{
        issues.forEach(it=>{
            const li = document.createElement('li'); li.textContent = it.message; li.className = it.type==='error'? 'issue-error':'issue-warn'; list.appendChild(li);
        });
        panel.appendChild(list);
    }
    const note = document.createElement('div'); note.style.marginTop='8px'; note.style.fontSize='12px'; note.style.color='var(--muted)'; note.textContent='Este é um checador simples; use Lighthouse/axe para auditoria completa.';
    panel.appendChild(note);
    document.body.appendChild(panel);

    // Log no console também
    if(issues.length===0) console.info('A11Y quick-check: nenhum problema rápido detectado');
    else { console.warn('A11Y quick-check:', issues); }
})();
