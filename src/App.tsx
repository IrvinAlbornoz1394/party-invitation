import { useEffect, useState } from 'react';
import { Invitation } from './components/invitation/Invitation';
import { PanelPage } from './pages/PanelPage';

const getPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

export default function App() {
  const [path, setPath] = useState(getPath);
  useEffect(() => { const onPopState = () => setPath(getPath()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  if (path === '/panel') return <PanelPage />;
  return <Invitation />;
}
