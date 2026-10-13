import { useEffect, useState } from 'react';
import { StoreProvider, useApp } from './ui/store';
import { Me, AssessCentre, Welcome, AssessView, Gym, Help, Home, Journal, Library, Programme, Progress, Review, ScenarioView, SessionView, Settings } from './ui/views';

const NAV = [['#/', 'Today', '☀'], ['#/programme', 'Programme', '🗺'], ['#/me', 'Me', '👤']] as const;
const PROGRAMME_ROUTES = ['programme', 'session', 'gym', 'scenarios', 'review'];
function useHash() { const [h, setH] = useState(location.hash || '#/'); useEffect(() => { const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return h; }

function Shell() {
  const { st, ready } = useApp();
  const h = useHash();
  useEffect(() => {
    const t = st.settings.theme;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { document.documentElement.dataset.theme = t === 'dark' || (t === 'auto' && mq.matches) ? 'dark' : 'light'; };
    apply();
    try { localStorage.setItem('esl-theme', t); } catch { /* storage unavailable */ }
    // Auto follows the phone live: re-apply when the OS switches between light and dark while the app is open.
    if (t !== 'auto') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [st.settings.theme]);
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }); }, [h]);
  const [, route, arg] = h.split('/');
  let view;
  if (!ready) view = <p>Loading…</p>;
  else switch (route) {
    case 'programme': view = <Programme />; break;
    case 'session': view = <SessionView key={arg} id={arg} />; break;
    case 'gym': case 'scenarios': view = arg ? <ScenarioView key={arg} id={arg} /> : <Gym />; break;
    case 'me': view = arg === 'reflections' ? <Journal /> : <Me />; break;
    case 'review': view = <Review />; break;
    case 'journal': view = <Journal />; break;
    case 'progress': view = <Progress />; break;
    case 'welcome': view = <Welcome />; break;
    case 'assess': view = !arg ? <AssessCentre /> : ['baseline', 'post', 'followup2', 'followup6'].includes(arg) ? <AssessView key={arg} kind={arg as 'baseline'} /> : <p>Unknown check.</p>; break;
    case 'library': view = <Library id={arg} />; break;
    case 'settings': view = <Settings />; break;
    case 'help': view = <Help />; break;
    default: view = <Home />;
  }
  return (<>
    <a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <header className="top"><a href="#/" className="brand">Emotional Skills Lab</a>
      <a href="#/help" className="pad">Help</a></header>
    <main id="main" tabIndex={-1}>{view}</main>
    <nav className="tabs" aria-label="Main">{NAV.map(([href, label, icon]) => {
      const area = !route ? '#/' : PROGRAMME_ROUTES.includes(route) ? '#/programme' : '#/me';
      return <a key={href} href={href} aria-current={area === href ? 'page' : undefined}><span aria-hidden className="ti">{icon}</span><span>{label}</span></a>;
    })}</nav>
  </>);
}
export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
