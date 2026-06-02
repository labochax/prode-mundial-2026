type UnsavedNavigationInput = {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  currentHref: string;
  dirty: boolean;
  download?: boolean;
  href: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: string | null;
};

export function shouldConfirmUnsavedNavigation({
  altKey,
  button = 0,
  ctrlKey,
  currentHref,
  dirty,
  download,
  href,
  metaKey,
  shiftKey,
  target,
}: UnsavedNavigationInput) {
  if (
    !dirty ||
    button !== 0 ||
    altKey ||
    ctrlKey ||
    metaKey ||
    shiftKey ||
    download ||
    target === "_blank"
  ) {
    return false;
  }

  const currentUrl = new URL(currentHref);
  const targetUrl = new URL(href, currentUrl);

  return !(
    targetUrl.origin === currentUrl.origin &&
    targetUrl.pathname === currentUrl.pathname &&
    targetUrl.search === currentUrl.search
  );
}
