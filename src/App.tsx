import { useEffect, useState } from 'react';
import { DemoPage } from './pages/DemoPage';
import { HomePage } from './pages/HomePage';

const getPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

export default function App() {
  const [path, setPath] = useState(getPath);
  useEffect(() => { const onPopState = () => setPath(getPath()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  return path === '/demo' ? <DemoPage /> : <HomePage />;
}
