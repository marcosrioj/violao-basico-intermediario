export type LinkPurpose = 'navigation' | 'reference';

/** Internal navigation stays in place; supporting references preserve the current task. */
export function opensNewTab(
  href: string,
  pathname: string | null,
  origin?: string,
  purpose: LinkPurpose = 'navigation',
): boolean {
  const destination = href.trim();
  if (!destination || destination.startsWith('#') || destination.startsWith('?')) return false;

  try {
    const base = new URL(pathname || '/', origin || 'https://navigation.invalid');
    const url = new URL(destination, base);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
    if (url.origin !== base.origin) return true;
    return (
      purpose === 'reference' && (!pathname || normalize(url.pathname) !== normalize(base.pathname))
    );
  } catch {
    return false;
  }
}
