import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmModal } from '@mairie360/lib-components/primitives';
import { AccessibleShell, defaultSidebarItems, SIDEBAR_COOKIE } from '@mairie360/lib-components/shell';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

let desktopViewportStyle;
const hrefs = Object.fromEntries(defaultSidebarItems.map(({ id }) => [id, `/${id}`]));
function shell() {
  return render(<AccessibleShell activeItem="dashboard" hrefs={hrefs} user={{ name: 'Agent du tableau' }}>
    <h1>Contenu du tableau</h1>
  </AccessibleShell>);
}
beforeEach(() => { document.cookie = `${SIDEBAR_COOKIE}=; Path=/; Max-Age=0`; });
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  desktopViewportStyle?.remove(); desktopViewportStyle = undefined;
  document.cookie = `${SIDEBAR_COOKIE}=; Path=/; Max-Age=0`;
});

it('renders one full-width footer after the main area, outside the navigation (lib-components 2.x)', () => {
  const { container } = shell();
  const footer = screen.getByRole('contentinfo');
  expect(footer.closest('aside')).toBeNull();
  expect(footer.closest('main')).toBeNull();
  const band = footer.closest('.app-shell-footer');
  expect(band).not.toBeNull();
  expect(band.previousElementSibling.contains(container.querySelector('main'))).toBe(true);
});

it('the skip link moves keyboard focus to the retained content target', async () => {
  desktopViewportStyle = document.createElement('style');
  desktopViewportStyle.textContent = '.app-desktop-navigation { display:flex; }';
  document.head.append(desktopViewportStyle);
  shell();
  const skip = screen.getByRole('link', { name: 'Aller au contenu' });
  const firstNavigationControl = document.querySelector('.app-desktop-navigation button');
  expect(skip.compareDocumentPosition(firstNavigationControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const destination = document.getElementById(skip.getAttribute('href').slice(1));
  expect(destination.tabIndex).toBe(-1);
  const user = userEvent.setup();
  await user.tab();
  expect(document.activeElement).toBe(skip);
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(destination);
  expect(within(destination).getByRole('heading', { name: 'Contenu du tableau' })).toBeTruthy();
});

it('the sole shared skip link is inert during an external confirmation and restores the same main target on cancellation', async () => {
  const confirmed = vi.fn();
  function Confirmation() {
    const [open, setOpen] = useState(false);
    return <>
      <button type="button" onClick={() => setOpen(true)}>Ouvrir la confirmation</button>
      <ConfirmModal isOpen={open} title="Confirmation locale" message="Confirmer cette action ?"
        onCancel={() => setOpen(false)} onConfirm={confirmed} />
    </>;
  }
  const user = userEvent.setup();
  const { container } = render(<AccessibleShell hrefs={hrefs}><h1>Contenu du tableau</h1><Confirmation /></AccessibleShell>);
  const skip = screen.getByRole('link', { name: 'Aller au contenu' });
  const main = screen.getByRole('main');
  expect(skip.getAttribute('href')).toBe(`#${main.id}`);
  expect(skip.closest('[inert]')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Ouvrir la confirmation' }));
  const dialog = screen.getByRole('dialog', { name: 'Confirmation locale' });
  await waitFor(() => expect(skip.closest('[inert]')).not.toBeNull());
  expect(container.querySelector('.app-desktop-navigation').hasAttribute('inert')).toBe(true);
  expect(container.querySelectorAll(`a[href="#${main.id}"]`)).toHaveLength(1);
  await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
  await waitFor(() => expect(skip.closest('[inert]')).toBeNull());
  expect(screen.getByRole('main')).toBe(main);
  expect(screen.getByRole('link', { name: 'Aller au contenu' })).toBe(skip);
  await user.click(skip);
  expect(document.activeElement).toBe(main);
  expect(confirmed).not.toHaveBeenCalled();
});

it('the desktop navigation rests collapsed and expands while keyboard focus is inside it (lib-components 2.x)', () => {
  // jsdom does not evaluate viewport media queries: activate the real desktop branch for its keyboard scenario.
  desktopViewportStyle = document.createElement('style');
  desktopViewportStyle.textContent = '.app-desktop-navigation { display:flex; }';
  document.head.append(desktopViewportStyle);
  const { container } = shell(), frame = container.querySelector('.app-shell-frame');
  const sidebar = container.querySelector('.app-desktop-navigation');
  expect(sidebar.getAttribute('data-expanded')).toBe('false');
  expect(frame.getAttribute('data-sidebar-collapsed')).toBe('true');
  const projects = within(sidebar).getByRole('button', { name: /Projets/ });
  fireEvent.keyDown(projects, { key: 'Tab' });
  act(() => projects.focus());
  expect(sidebar.getAttribute('data-expanded')).toBe('true');
  expect(frame.getAttribute('data-sidebar-collapsed')).toBe('false');
  act(() => projects.blur());
  expect(sidebar.getAttribute('data-expanded')).toBe('false');
});
