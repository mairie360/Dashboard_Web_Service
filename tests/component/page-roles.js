import { screen, waitFor } from '@testing-library/react';

// MAIR-915: the lib ToastProvider keeps two live regions in the page (role alert and status) to announce
// its toasts. The page's own alerts and statuses are the other ones.
const outsideToasts = (element) => !element.closest('[data-m360-component~="ToastProvider"]');

export const pageAlerts = () => screen.queryAllByRole('alert').filter(outsideToasts);
export const pageStatuses = () => screen.queryAllByRole('status').filter(outsideToasts);

/** The one page alert (fails on none or several, like getByRole). */
export function pageAlert() {
  const found = pageAlerts();
  if (found.length !== 1) throw new Error(`expected one page alert, found ${found.length}`);
  return found[0];
}
export function pageStatus() {
  const found = pageStatuses();
  if (found.length !== 1) throw new Error(`expected one page status, found ${found.length}: ${found.map((node) => node.textContent).join(' | ')}`);
  return found[0];
}
export const findPageAlert = () => waitFor(pageAlert);
