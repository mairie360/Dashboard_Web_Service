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

it('measures the real footer after resize and disconnects its observer when the shell unmounts', () => {
  let footerHeight = 78.2;
  const observers = [];
  vi.stubGlobal('ResizeObserver', class {
    constructor(receive) { this.receive = receive; this.targets = []; this.disconnect = vi.fn(); observers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve() {}
  });
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  // jsdom has no geometry; supply only the measured footer height to exercise the actual callback.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.matches('footer.app-accessible-footer') ? { ...originalRect.call(this), height: footerHeight } : originalRect.call(this);
  });
  const { container, unmount } = shell();
  const footer = screen.getByRole('contentinfo'), frame = container.querySelector('.app-shell-frame');
  const observer = observers.find(candidate => candidate.targets.includes(footer));
  expect(observer).toBeTruthy();
  expect(frame.style.getPropertyValue('--app-footer-height')).toBe('79px');
  footerHeight = 100.01;
  act(() => observer.receive([], observer));
  expect(frame.style.getPropertyValue('--app-footer-height')).toBe('101px');
  unmount(); expect(observer.disconnect).toHaveBeenCalledTimes(1);
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

it('the collapsed preference restores, exposes keyboard tooltips, persists an explicit toggle and synchronizes on focus', async () => {
  // jsdom does not evaluate viewport media queries: activate the real desktop branch for its keyboard scenario.
  desktopViewportStyle = document.createElement('style');
  desktopViewportStyle.textContent = '.app-desktop-navigation { display:flex; }';
  document.head.append(desktopViewportStyle);
  document.cookie = `${SIDEBAR_COOKIE}=v1:collapsed; Path=/`;
  const { container } = shell(), frame = container.querySelector('.app-shell-frame');
  expect(frame.getAttribute('data-sidebar-collapsed')).toBe('true');
  const sidebar = container.querySelector('.app-desktop-navigation');
  expect(getComputedStyle(sidebar).display).toBe('flex');
  const projects = within(sidebar).getByRole('button', { name: 'Projets', exact: true });
  act(() => projects.focus());
  expect(screen.getByRole('tooltip').textContent).toBe('Projets');
  fireEvent.keyDown(projects, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).toBeNull();
  await userEvent.setup().click(within(sidebar).getByRole('button', { name: 'Développer la navigation' }));
  expect(frame.getAttribute('data-sidebar-collapsed')).toBe('false');
  expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=v1:expanded`);
  document.cookie = `${SIDEBAR_COOKIE}=v1:collapsed; Path=/`;
  act(() => window.dispatchEvent(new Event('focus')));
  expect(frame.getAttribute('data-sidebar-collapsed')).toBe('true');
});
