/**
 * MandiMitra Client-Side Hash Router
 * Routes between /, /hub, /markets, /decision, /evidence, /backtest, /settings.
 * 
 * Supports dynamic route registration so team members can add new routes
 * without creating merge conflicts in a monolithic switch-statement.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { AppRoute } from '../../contracts/frontend';
import { store } from '../state/store';
import { renderDecisionHubView } from '../features/hub/DecisionHubView';
import { renderEntryView } from '../features/entry/EntryView';
import { renderDecisionView } from '../features/decision/DecisionView';
import { renderEvidenceView } from '../features/evidence/EvidenceView';
import { renderMarketsView } from '../features/markets/MarketsView';
import { renderSettingsView } from '../features/settings/SettingsView';
import { renderBacktestView } from '../features/backtest/BacktestView';

export type RouteRenderer = () => HTMLElement;

export class Router {
  private mountPoint: HTMLElement;
  private routes: Map<string, RouteRenderer> = new Map();

  constructor(mountPoint: HTMLElement) {
    this.mountPoint = mountPoint;

    // Register standard default routes (Default / and /hub load the Decision Hub)
    this.routes.set('/', renderDecisionHubView);
    this.routes.set('/hub', renderDecisionHubView);
    this.routes.set('/entry', renderEntryView);
    this.routes.set('/decision', renderDecisionView);
    this.routes.set('/evidence', renderEvidenceView);
    this.routes.set('/markets', renderMarketsView);
    this.routes.set('/settings', renderSettingsView);
    this.routes.set('/backtest', renderBacktestView);

    window.addEventListener('hashchange', () => this.handleHashChange());
    store.subscribe((state) => {
      const hash = `#${state.currentRoute}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
      this.render(state.currentRoute);
    });
  }

  /**
   * Register a custom or experimental route dynamically without modifying core files.
   */
  public registerRoute(path: string, renderer: RouteRenderer): void {
    this.routes.set(path, renderer);
  }

  public init(): void {
    this.handleHashChange();
  }

  private handleHashChange(): void {
    const hash = window.location.hash.replace('#', '') || '/';
    const targetRoute = this.routes.has(hash) ? hash : '/';
    store.setRoute(targetRoute as AppRoute);
  }

  private render(route: string): void {
    this.mountPoint.innerHTML = '';

    const renderer = this.routes.get(route) || this.routes.get('/') || renderDecisionHubView;
    const view = renderer();

    this.mountPoint.appendChild(view);
    this.updateActiveNav(route);
  }

  private updateActiveNav(route: string): void {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      if (href === route || (route === '/' && href === '/hub')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
