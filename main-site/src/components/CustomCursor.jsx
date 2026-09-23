import { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

// Anything the page (or the browser) has given a real, non-"none" cursor to
// should show ITS cursor — the hand for links/buttons, the I-beam for text
// fields, etc. — instead of the custom dot, so the two never overlap.
function hasNativeCursor(target) {
  if (!target || target.nodeType !== 1) return false;
  return window.getComputedStyle(target).cursor !== 'none';
}

function CustomCursor() {
  const dotRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [overNative, setOverNative] = useState(false);

  const lastTarget = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    const move = (event) => {
      // Move the DOM node directly instead of going through React state,
      // so mouse movement doesn't trigger a re-render on every pixel.
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }

      setVisible((v) => (v ? v : true));

      // Only recompute the native-cursor check when the hovered element
      // actually changes, and defer it to the next frame so it never
      // blocks the pointer-tracking above.
      const target = event.target;
      if (target !== lastTarget.current) {
        lastTarget.current = target;

        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          setOverNative(hasNativeCursor(target));
        });
      }
    };

    const leave = () => {
      setVisible(false);
    };

    const enter = () => {
      setVisible(true);
    };

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const showCustom = visible && !overNative;

  return (
    <div
      ref={dotRef}
      className={`custom-cursor ${
        showCustom ? 'cursor-visible' : 'cursor-hidden'
      }`}
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <span />
    </div>
  );
}

export default CustomCursor;
