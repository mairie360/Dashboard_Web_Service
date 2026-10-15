import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultSidebarItems } from '@mairie360/lib-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AccessibleShell from '@/components/accessible-shell';
import { SIDEBAR_COOKIE } from '@/lib/sidebar-preference';

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
  shell();
  const skip = screen.getByRole('link', { name: 'Aller au contenu' });
  const destination = document.getElementById(skip.getAttribute('href').slice(1));
  expect(destination.tabIndex).toBe(-1);
  await userEvent.setup().click(skip);
  expect(document.activeElement).toBe(destination);
  expect(within(destination).getByRole('heading', { name: 'Contenu du tableau' })).toBeTruthy();
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
