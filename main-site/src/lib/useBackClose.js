import { useEffect, useRef } from 'react';

/*
 * useBackClose(isOpen, onClose)
 *
 * Makes the phone's back gesture / back button close a popup, modal or menu
 * instead of leaving the page.
 *
 *  - When `isOpen` turns true, one history entry is pushed.
 *  - Back gesture / back button  -> that entry is popped and `onClose()` runs.
 *  - Closed with the X / overlay / Escape -> the extra entry is removed again,
 *    so the history never fills up and back never feels "stuck".
 *
 * It only adds history handling. It never touches your open/close state,
 * styles or animations - `onClose` is your existing close function.
 */

const stack = []; // open overlays, topmost last (one history entry each)
const ownBacks = []; // history.back() calls we made ourselves (ignore their popstate)
let listening = false;
let nextId = 1;

function onPopState() {
  // popstate caused by our own history.back() clean-up: nothing to close
  if (ownBacks.length) {
    const own = ownBacks.shift();
    clearTimeout(own.timer);
    return;
  }

  // A real back gesture / button press: close the topmost overlay
  const item = stack.pop();
  if (item) {
    clearTimeout(item.timer);
    if (!item.closing) item.close();
  }
}

function openEntry(close) {
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }

  // An overlay closed in this same tick (React StrictMode re-run, or the mobile
  // menu handing over to the Join popup): reuse its history entry instead of
  // adding a second one.
  const top = stack[stack.length - 1];
  if (top && top.closing) {
    clearTimeout(top.timer);
    top.closing = false;
    top.close = close;
    return top;
  }

  const item = { id: nextId++, close, closing: false, timer: 0 };
  window.history.pushState({ cipherOverlay: item.id }, '');
  stack.push(item);
  return item;
}

function releaseEntry(item) {
  item.closing = true;

  // Deferred one tick so a link click that navigates (#about etc.) finishes first
  item.timer = setTimeout(() => {
    const index = stack.indexOf(item);
    if (index === -1) return; // already removed by the back gesture

    stack.splice(index, 1);

    // Only undo our own entry, and only if we are still standing on it
    const stillOnEntry = window.history.state && window.history.state.cipherOverlay === item.id;
    if (index === stack.length && stillOnEntry) {
      const own = { timer: 0 };
      // safety: if the browser never fires popstate, don't swallow a real back later
      own.timer = setTimeout(() => {
        const i = ownBacks.indexOf(own);
        if (i !== -1) ownBacks.splice(i, 1);
      }, 1000);
      ownBacks.push(own);
      window.history.back();
    }
  }, 0);
}

export default function useBackClose(isOpen, onClose) {
  const closeRef = useRef(onClose);

  // always call the latest onClose without re-running the history effect
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const item = openEntry(() => closeRef.current && closeRef.current());
    return () => releaseEntry(item);
  }, [isOpen]);
}
