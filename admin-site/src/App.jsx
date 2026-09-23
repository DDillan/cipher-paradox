import CustomCursor from './components/CustomCursor';
import AdminPanel from './components/AdminPanel';
import './App.css';

// Where "← MAIN SITE" should send people back to.
// Set VITE_MAIN_SITE_URL in .env, e.g. https://cipher-sjec.com
const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || '/';

function App() {
  return (
    <main className="app">
      <CustomCursor />
      <AdminPanel onExit={() => { window.location.href = MAIN_SITE_URL; }} />
    </main>
  );
}

export default App;
