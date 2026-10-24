function installPuzzleTouch({ area, pool, isActive, onTap, onDragStart, onDrop }) {
    let gesture = null;
    let suppressClickUntil = 0;

    function findTarget(event) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.drop-zone, .pool-area');
        return target && area.contains(target) ? target : null;
    }

    function clearHighlights() {
        area.querySelectorAll('.drag-over').forEach(target => target.classList.remove('drag-over'));
    }

    function cancel() {
        if (!gesture) return;
        const previous = gesture;
        gesture = null;
        previous.ghost?.remove();
        previous.piece.style.opacity = '';
        clearHighlights();
        if (previous.piece.hasPointerCapture(previous.pointerId)) {
            previous.piece.releasePointerCapture(previous.pointerId);
        }
    }

    area.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') return;
        suppressClickUntil = 0;
        if (!event.isPrimary) {
            cancel();
            return;
        }
        const piece = event.target.closest('.piece');
        if (!piece || !isActive() || gesture) return;
        event.preventDefault();
        gesture = { piece, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, ghost: null };
        piece.setPointerCapture(event.pointerId);
    });

    area.addEventListener('pointermove', event => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        if (!isActive()) {
            cancel();
            return;
        }
        event.preventDefault();
        if (!gesture.ghost) {
            if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 6) return;
            onDragStart();
            const bounds = gesture.piece.getBoundingClientRect();
            const ghost = document.createElement('img');
            ghost.src = gesture.piece.src;
            ghost.alt = '';
            ghost.className = 'puzzle-touch-ghost';
            Object.assign(ghost.style, {
                position: 'fixed', pointerEvents: 'none', zIndex: '100',
                width: `${bounds.width}px`, height: `${bounds.height}px`,
                transform: 'translate(-50%, -100%)', opacity: '0.92',
                border: '2px solid #3b82f6', borderRadius: '4px',
                boxShadow: '0 8px 20px #20392f40', background: 'white'
            });
            document.body.appendChild(ghost);
            gesture.ghost = ghost;
            gesture.piece.style.opacity = '0.35';
        }
        const ghostWidth = gesture.ghost.offsetWidth;
        const ghostHeight = gesture.ghost.offsetHeight;
        gesture.ghost.style.left = `${Math.max(ghostWidth / 2 + 4, Math.min(innerWidth - ghostWidth / 2 - 4, event.clientX))}px`;
        gesture.ghost.style.top = `${Math.max(ghostHeight + 4, Math.min(innerHeight - 4, event.clientY - 12))}px`;
        clearHighlights();
        findTarget(event)?.classList.add('drag-over');
    });

    area.addEventListener('pointerup', event => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        event.preventDefault();
        const { piece, ghost } = gesture;
        const target = ghost ? findTarget(event) : null;
        cancel();
        suppressClickUntil = performance.now() + 500;
        if (!isActive()) return;
        if (!ghost) {
            onTap(piece);
        } else if (target && target !== piece.parentElement) {
            if (target !== pool && target.firstElementChild) {
                piece.parentElement.appendChild(target.firstElementChild);
            }
            target.appendChild(piece);
            onDrop();
        }
    });

    area.addEventListener('pointercancel', cancel);
    area.addEventListener('lostpointercapture', event => {
        if (gesture?.pointerId === event.pointerId) cancel();
    });
    area.addEventListener('contextmenu', event => {
        if (event.target.closest('.piece')) event.preventDefault();
    });
    area.addEventListener('dragstart', event => {
        if (gesture) event.preventDefault();
    }, true);
    area.addEventListener('click', event => {
        if (performance.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    return cancel;
}