import { useEffect, useMemo, useState, type FormEvent, type JSX } from 'react';
import type { AppHostProps } from './registry';

interface Article {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly lede: string;
  readonly summary: string;
  readonly headings: ReadonlyArray<{ id: string; text: string }>;
  readonly paragraphs: ReadonlyArray<string>;
  readonly links: ReadonlyArray<{ label: string; to: string }>;
}

const HOME: Article = {
  id: 'home',
  title: 'Neon Browser',
  url: 'neon://home',
  lede: 'A tiny in-browser browser bundled with Neon OS.',
  summary:
    'Neon Browser does not have network access for security reasons. It ships with a small, offline knowledge base covering common topics so you can browse without the internet.',
  headings: [
    { id: 'welcome', text: 'Welcome' },
    { id: 'how-it-works', text: 'How it works' },
    { id: 'shortcuts', text: 'Shortcuts' },
  ],
  paragraphs: [
    'Welcome to Neon Browser, the offline companion app that ships with Neon OS. It demonstrates a fully working address bar, back/forward navigation, bookmarks, and rendered articles.',
    'The browser is intentionally sandboxed: it can only render built-in articles and Wikipedia-style pages stored locally in the OS. There is no network or remote iframe support.',
    'Use the address bar to go to a built-in page like `wiki:neon` or `about:blank`, or click a link in any article to navigate to a related page.',
  ],
  links: [
    { label: 'Neon OS', to: 'wiki:neon' },
    { label: 'TypeScript', to: 'wiki:typescript' },
    { label: 'React', to: 'wiki:react' },
    { label: 'Vite', to: 'wiki:vite' },
    { label: 'Operating System', to: 'wiki:os' },
  ],
};

const WIKI: ReadonlyArray<Article> = [
  {
    id: 'wiki:neon',
    title: 'Neon OS — Wikipedia',
    url: 'wiki:neon',
    lede: 'Neon OS is a tiny browser-based desktop environment.',
    summary:
      'Neon OS is a demo desktop environment that runs entirely inside a web browser. It provides a start menu, taskbar, window manager, and a small set of built-in applications: Notepad, Paint, Calculator, Terminal, Files, and a sandboxed Browser.',
    headings: [
      { id: 'overview', text: 'Overview' },
      { id: 'apps', text: 'Applications' },
      { id: 'tech', text: 'Technology' },
    ],
    paragraphs: [
      'Neon OS is implemented in React, TypeScript, and Vite. It uses Zustand for state management and ships with a window manager that supports moving, resizing, minimizing, and maximizing windows.',
      'The file system is virtual and lives entirely in memory. It includes a small starting set of files: Welcome.txt, README.md, palette.cfg, Quick Notes.txt, and a logo image.',
      'The Terminal supports a small set of commands: `help`, `ls`, `cd`, `pwd`, `cat`, `write`, `mkdir`, `rm`, `open`, `date`, `echo`, `clear`, and `about`.',
    ],
    links: [
      { label: 'TypeScript', to: 'wiki:typescript' },
      { label: 'React', to: 'wiki:react' },
      { label: 'Vite', to: 'wiki:vite' },
      { label: 'Wikipedia (real)', to: 'wiki:wikipedia' },
    ],
  },
  {
    id: 'wiki:wikipedia',
    title: 'Wikipedia — Wikipedia',
    url: 'wiki:wikipedia',
    lede: 'Wikipedia is a free, multilingual online encyclopedia.',
    summary:
      'Wikipedia is the largest and most-read reference work in history. It is a free-content online encyclopedia project, written collaboratively by volunteers from all around the world.',
    headings: [
      { id: 'overview', text: 'Overview' },
      { id: 'history', text: 'History' },
      { id: 'model', text: 'Model' },
    ],
    paragraphs: [
      'Wikipedia was launched on January 15, 2001, by Jimmy Wales and Larry Sanger. It is hosted by the Wikimedia Foundation, a non-profit organization.',
      'Articles are written by volunteers and are available under a Creative Commons license. The site is supported by donations and grants.',
      'Wikipedia is available in more than 300 languages and contains more than 60 million articles across all editions.',
      'In this offline demo, Wikipedia is reproduced as a stub page that you can navigate to via the Neon Browser address bar (try entering `wiki:wikipedia` or following the link from the Neon OS article).',
    ],
    links: [
      { label: 'Neon OS', to: 'wiki:neon' },
      { label: 'React', to: 'wiki:react' },
      { label: 'TypeScript', to: 'wiki:typescript' },
    ],
  },
  {
    id: 'wiki:typescript',
    title: 'TypeScript — Wikipedia',
    url: 'wiki:typescript',
    lede: 'TypeScript is a free and open-source high-level programming language.',
    summary:
      'TypeScript adds optional static typing and class-based object-oriented programming to JavaScript. It is developed and maintained by Microsoft.',
    headings: [
      { id: 'overview', text: 'Overview' },
      { id: 'features', text: 'Features' },
    ],
    paragraphs: [
      'TypeScript is designed for the development of large applications and transcompiles to JavaScript. As it is a strict syntactical superset of JavaScript, all existing JavaScript programs are also valid TypeScript programs.',
      'TypeScript supports structural typing, generics, enums, tuples, and type inference. Its compiler can be used standalone or integrated with build tools such as Vite, esbuild, and webpack.',
    ],
    links: [
      { label: 'JavaScript', to: 'wiki:javascript' },
      { label: 'Vite', to: 'wiki:vite' },
    ],
  },
  {
    id: 'wiki:javascript',
    title: 'JavaScript — Wikipedia',
    url: 'wiki:javascript',
    lede: 'JavaScript is a high-level, dynamic, untyped, interpreted programming language.',
    summary:
      'JavaScript is the programming language of the Web. It was originally implemented as part of web browsers so that client-side scripts could interact with the user, control the browser, communicate asynchronously, and alter the document content that was displayed.',
    headings: [
      { id: 'overview', text: 'Overview' },
    ],
    paragraphs: [
      'JavaScript is a prototype-based, multi-paradigm scripting language that is dynamic, and supports object-oriented, imperative, and functional programming styles.',
    ],
    links: [
      { label: 'TypeScript', to: 'wiki:typescript' },
      { label: 'React', to: 'wiki:react' },
    ],
  },
  {
    id: 'wiki:react',
    title: 'React (software) — Wikipedia',
    url: 'wiki:react',
    lede: 'React is a free and open-source front-end JavaScript library.',
    summary:
      'React is a JavaScript library for building user interfaces. It is maintained by Meta and a community of individual developers and companies.',
    headings: [
      { id: 'overview', text: 'Overview' },
    ],
    paragraphs: [
      'React can be used as a base in the development of single-page or mobile applications. Its core principle is the concept of a virtual DOM that efficiently updates the rendered UI.',
    ],
    links: [
      { label: 'Vite', to: 'wiki:vite' },
      { label: 'TypeScript', to: 'wiki:typescript' },
    ],
  },
  {
    id: 'wiki:vite',
    title: 'Vite (software) — Wikipedia',
    url: 'wiki:vite',
    lede: 'Vite is a local development server written for Vue and React.',
    summary:
      'Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects. It consists of two major parts: a dev server with Hot Module Replacement, and a build command.',
    headings: [
      { id: 'overview', text: 'Overview' },
    ],
    paragraphs: [
      'Vite uses native ES modules in the browser and esbuild for fast TypeScript transpilation during development. Production builds are powered by Rollup.',
    ],
    links: [
      { label: 'React', to: 'wiki:react' },
      { label: 'TypeScript', to: 'wiki:typescript' },
    ],
  },
  {
    id: 'wiki:os',
    title: 'Operating system — Wikipedia',
    url: 'wiki:os',
    lede: 'An operating system (OS) is system software that manages computer hardware and software resources.',
    summary:
      'An operating system provides services for computer programs, including execution, scheduling, memory management, I/O operations, and file system management.',
    headings: [
      { id: 'overview', text: 'Overview' },
    ],
    paragraphs: [
      'Common modern operating systems include Microsoft Windows, macOS, Linux, Android, and iOS. Neon OS is a tiny, browser-based desktop environment that mimics some of the same concepts.',
    ],
    links: [
      { label: 'Neon OS', to: 'wiki:neon' },
    ],
  },
];

const findArticle = (url: string): Article | null => {
  if (url === 'neon://home' || url === 'about:home' || url === 'home' || url === '') return HOME;
  if (url.startsWith('wiki:')) {
    return WIKI.find((a) => a.id === url) ?? null;
  }
  return null;
};

export const BrowserApp = (_props: AppHostProps): JSX.Element => {
  const initial: Article = HOME;
  const [stack, setStack] = useState<ReadonlyArray<Article>>([initial]);
  const [idx, setIdx] = useState<number>(0);
  const current = stack[idx] ?? initial;
  const [url, setUrl] = useState<string>(initial.url);

  useEffect(() => {
    setUrl(current.url);
  }, [current]);

  const navigateTo = (to: string): void => {
    const article = findArticle(to);
    if (!article) {
      const stub: Article = {
        id: `404:${to}`,
        title: 'Not found',
        url: to,
        lede: 'The page could not be found in the offline knowledge base.',
        summary: `Neon Browser can only render built-in pages. "${to}" is not available offline.`,
        headings: [],
        paragraphs: [
          'Try one of the bookmarks above, or enter a URL such as `wiki:wikipedia` or `neon://home` in the address bar.',
        ],
        links: [
          { label: 'Home', to: 'neon://home' },
          { label: 'Wikipedia (offline stub)', to: 'wiki:wikipedia' },
          { label: 'Neon OS', to: 'wiki:neon' },
        ],
      };
      setStack((s) => [...s.slice(0, idx + 1), stub]);
      setIdx((i) => i + 1);
      setUrl(to);
      return;
    }
    setStack((s) => [...s.slice(0, idx + 1), article]);
    setIdx((i) => i + 1);
    setUrl(article.url);
  };

  const goBack = (): void => {
    if (idx > 0) setIdx(idx - 1);
  };
  const goForward = (): void => {
    if (idx < stack.length - 1) setIdx(idx + 1);
  };
  const reload = (): void => {
    setStack((s) => [...s]);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    let v = url.trim();
    if (v.length === 0) return;
    if (v === 'home') v = 'neon://home';
    if (v === 'wikipedia' || v === 'https://wikipedia.org' || v === 'https://en.wikipedia.org') v = 'wiki:wikipedia';
    if (v === 'wiki') v = 'wiki:wikipedia';
    if (!v.includes(':')) v = `wiki:${v.toLowerCase().replace(/\s+/g, '-')}`;
    navigateTo(v);
  };

  const canBack = idx > 0;
  const canFwd = idx < stack.length - 1;

  const bookmarkItems = useMemo<ReadonlyArray<{ label: string; to: string }>>(() => ([
    { label: '?? Home', to: 'neon://home' },
    { label: 'Wikipedia', to: 'wiki:wikipedia' },
    { label: 'Neon OS', to: 'wiki:neon' },
    { label: 'TypeScript', to: 'wiki:typescript' },
    { label: 'React', to: 'wiki:react' },
    { label: 'Vite', to: 'wiki:vite' },
  ]), []);

  return (
    <div className="browser">
      <div className="bar">
        <button type="button" onClick={goBack} disabled={!canBack} title="Back" aria-label="Back">?</button>
        <button type="button" onClick={goForward} disabled={!canFwd} title="Forward" aria-label="Forward">?</button>
        <button type="button" onClick={reload} title="Reload" aria-label="Reload">?</button>
        <form onSubmit={onSubmit} style={{ display: 'flex', flex: 1 }} role="search">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL — e.g. wiki:wikipedia, wiki:neon, neon://home"
            spellCheck={false}
            aria-label="Address bar"
          />
        </form>
      </div>
      <div className="bookmarks" role="navigation" aria-label="Bookmarks">
        {bookmarkItems.map((b) => (
          <button key={b.to} type="button" onClick={() => navigateTo(b.to)}>{b.label}</button>
        ))}
      </div>
      <div className="page" role="main">
        <h1>{current.title}</h1>
        <div className="lede">{current.lede}</div>
        <div className="summary">{current.summary}</div>
        {current.headings.map((h) => (
          <div key={h.id}>
            <h2 id={h.id}>{h.text}</h2>
          </div>
        ))}
        {current.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {current.links.length > 0 && (
          <>
            <h2>See also</h2>
            <ul>
              {current.links.map((l) => (
                <li key={l.to}>
                  <a
                    onClick={() => navigateTo(l.to)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigateTo(l.to); }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        {current.id === 'home' && (
          <div className="placeholder">
            Tip: try the Wikipedia link in "See also" or type `wiki:wikipedia` in the address bar.
          </div>
        )}
      </div>
      <div className="status">
        <span>{current.url}</span>
        <span>{canBack ? '?' : ''} {canFwd ? '?' : ''} · {idx + 1}/{stack.length}</span>
      </div>
    </div>
  );
};
