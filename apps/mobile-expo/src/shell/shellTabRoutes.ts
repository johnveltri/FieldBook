export type ShellMainTab = 'home' | 'jobs' | 'earnings';

/** File-route paths (route groups `(app)` / `(tabs)` are omitted from URLs). */
export const SHELL_TAB_HREF: Record<ShellMainTab, string> = {
  home: '/',
  jobs: '/jobs',
  earnings: '/earnings',
};

export function shellMainTabFromPathname(pathname: string): ShellMainTab {
  if (pathname === '/jobs' || pathname.startsWith('/jobs/')) return 'jobs';
  if (pathname === '/earnings' || pathname.startsWith('/earnings/')) return 'earnings';
  return 'home';
}
