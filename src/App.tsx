import { useEffect, useState } from 'react';
import { StoreProvider, useApp } from './ui/store';
import { AssessCentre, Welcome, AssessView, Gym, Help, Home, Journal, Library, Programme, Progress, Review, ScenarioView, SessionView, Settings } from './ui/views';

const NAV = [['#/', 'Today'], ['#/programme', 'Learn'], ['#/gym', 'Gym'], ['#/journal', 'Journal'], ['#/progress', 'Progress']] as const;
function useHash() { const [h, setH] = useState(location.hash || '#/'); useEffect(() => { const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return h; }

function Shell() {
  const { st, ready } = useApp();
  const h = useHash();
  useEffect(() => {
    const t = st.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('esl-theme', t); } catch { /* storage unavailable */ }
  }, [st.settings.theme]);
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }); }, [h]);
  const [, route, arg] = h.split('/');
  let view;
  if (!ready) view = <p>Loading…</p>;
  else switch (route) {
    case 'programme': view = <Programme />; break;
    case 'session': view = <SessionView key={arg} id={arg} />; break;
    case 'gym': view = arg ? <ScenarioView key={arg} id={arg} /> : <Gym />; break;
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
      <nav aria-label="More"><a href="#/library">Library</a><a href="#/settings">Settings</a></nav></header>
    <main id="main" tabIndex={-1}>{view}</main>
    <nav className="tabs" aria-label="Main">{NAV.map(([href, label]) => {
      const active = href === '#/' ? !route : href.startsWith(`#/${route}`) || (route === 'session' && href === '#/programme');
      return <a key={href} href={href} aria-current={active ? 'page' : undefined}>{label}</a>;
    })}</nav>
  </>);
}
export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
