/**
 * MandiMitra Client Entrypoint
 * Bootstraps the AppShell and activates the router.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { renderAppShell } from './shell/AppShell';
import { Router } from './shell/Router';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  const shell = renderAppShell();
  appElement.appendChild(shell);

  const routerMountPoint = document.getElementById('router-view');
  if (routerMountPoint) {
    const router = new Router(routerMountPoint);
    router.init();
  }
});
