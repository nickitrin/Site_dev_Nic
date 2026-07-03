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
