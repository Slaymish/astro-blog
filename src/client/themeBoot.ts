/**
 * The one inline script on every page. It runs before the first stylesheet
 * parses, so the theme class is on <html> before first paint and there is no
 * flash of the wrong theme.
 *
 * Base.astro hashes this exact string for the Content-Security-Policy, so the
 * bytes here and the hash in the meta element are the same source. Changing
 * it changes the hash automatically; changing how it is embedded does not, so
 * re-read the CSP section of the rewrite plan before touching either.
 *
 * Writing `r.style.colorScheme` from script is allowed under a hash-only
 * policy: the policy restricts `style` attributes in markup, not CSSOM writes.
 */
export const THEME_BOOT =
  "(function(){var r=document.documentElement,s=null;try{s=localStorage.getItem('theme')}catch(e){}var l=window.matchMedia('(prefers-color-scheme: light)').matches,t=s==='light'||s==='dark'?s:(l?'light':'dark');r.classList.remove('light','dark');r.classList.add(t);r.dataset.themeSource=s?'user':'system';r.style.colorScheme=t;})();";
