function installPuzzleTouch({ area, pool, isActive, onTap, onDragStart, onDrop }) {
    let gesture = null;
    let suppressClickUntil = 0;

    function findTarget(event) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.drop-zone, .pool-area');
        if (target && area.contains(target)) return target;
        let nearest = null;
        let nearestDistance = Infinity;
        area.querySelectorAll('.drop-zone').forEach(zone => {
            const bounds = zone.getBoundingClientRect();
            const distance = Math.hypot(
                Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right),
                Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom)
            );
            const snapRadius = Math.min(28, Math.max(14, bounds.width * 0.35));
            if (distance <= snapRadius && distance < nearestDistance) {
                nearest = zone;
                nearestDistance = distance;
            }
        });
        return nearest;
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
            gesture.previewSize = { width: bounds.width, height: bounds.height };
            gesture.piece.style.opacity = '0.35';
        }
        const target = findTarget(event);
        const snapped = target?.classList.contains('drop-zone');
        const bounds = snapped ? target.getBoundingClientRect() : null;
        gesture.ghost.classList.toggle('is-snapped', Boolean(snapped));
        gesture.ghost.style.transition = snapped ? 'left 70ms ease-out, top 70ms ease-out, width 70ms ease-out, height 70ms ease-out' : 'none';
        gesture.ghost.style.width = `${snapped ? bounds.width - 4 : gesture.previewSize.width}px`;
        gesture.ghost.style.height = `${snapped ? bounds.height - 4 : gesture.previewSize.height}px`;
        gesture.ghost.style.transform = snapped ? 'translate(-50%, -50%)' : 'translate(-50%, -100%)';
        const ghostWidth = gesture.ghost.offsetWidth;
        const ghostHeight = gesture.ghost.offsetHeight;
        gesture.ghost.style.left = `${bounds ? bounds.left + bounds.width / 2 : Math.max(ghostWidth / 2 + 4, Math.min(innerWidth - ghostWidth / 2 - 4, event.clientX))}px`;
        gesture.ghost.style.top = `${bounds ? bounds.top + bounds.height / 2 : Math.max(ghostHeight + 4, Math.min(innerHeight - 4, event.clientY - 12))}px`;
        clearHighlights();
        target?.classList.add('drag-over');
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