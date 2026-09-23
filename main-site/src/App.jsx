import { useEffect, useState } from 'react';
import CustomCursor from './components/CustomCursor';
import About from './pages/About';
import Leadership from './pages/Leadership';
import Events from './pages/Events';
import Join from './pages/Join';
import Footer from './components/Footer';
import Domains from './pages/Domains';
import './App.css';

import BootSequence from './components/BootSequence';
import { attachUiSounds } from './lib/sound';
import TopographicBackground from './components/TopographicBackground';

import Home from './pages/Home';

/*
 * phase
 *   boot    - terminal + CIPHER decrypt, page underneath is idle
 *   opening - the boot panels slide apart, the hero starts its reveal
 *   ready   - boot is gone, the rest of the page can load
 */
function App() {
  const [phase, setPhase] = useState('boot');
  const [contentReady, setContentReady] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const started = phase !== 'boot';
  const ready = phase === 'ready';

  // Hover + click sounds for every link and button
  useEffect(() => attachUiSounds(), []);

  // No scrolling behind the intro
  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden';

    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [ready]);

  // Mount the heavy below-the-fold sections only once the intro has finished
  // AND the browser is idle, so the reveal never competes with them for frames.
  useEffect(() => {
    if (!ready) return;

    const mount = () => setContentReady(true);

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(mount, { timeout: 600 });
      return () => window.cancelIdleCallback(id);
    }

    const id = setTimeout(mount, 200);
    return () => clearTimeout(id);
  }, [ready]);

  return (
    <main className="app">
      {!ready && (
        <BootSequence
          onOpen={() => setPhase((p) => (p === 'boot' ? 'opening' : p))}
          onComplete={() => setPhase('ready')}
        />
      )}

      <TopographicBackground running={started} />

      <Home active={started} onJoin={() => setJoinOpen(true)} />
      <CustomCursor />

      {contentReady && (
        <>
          <About />
          <Domains />
          <Leadership />
          <Events />
          <Join open={joinOpen} onJoin={() => setJoinOpen(true)} onClose={() => setJoinOpen(false)} />
          <Footer />
        </>
      )}
    </main>
  );
}

export default App;
