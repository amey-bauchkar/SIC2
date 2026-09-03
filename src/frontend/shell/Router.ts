/**
 * MandiMitra Client-Side Hash Router
 * Routes between /, /markets, /decision, /evidence, /backtest, /settings.
 * 
 * OWNER: Janhvi (Frontend Lead)
 */

import { AppRoute } from '../../contracts/frontend';
import { store } from '../state/store';
import { renderEntryView } from '../features/entry/EntryView';
import { renderDecisionView } from '../features/decision/DecisionView';
import { renderEvidenceView } from '../features/evidence/EvidenceView';
import { renderMarketsView } from '../features/markets/MarketsView';
import { renderSettingsView } from '../features/settings/SettingsView';
import { renderBacktestView } from '../features/backtest/BacktestView';

export class Router {
  private mountPoint: HTMLElement;

  constructor(mountPoint: HTMLElement) {
    this.mountPoint = mountPoint;
    window.addEventListener('hashchange', () => this.handleHashChange());
    store.subscribe((state) => {
      const hash = `#${state.currentRoute}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
      this.render(state.currentRoute);
    });
  }

  public init(): void {
    this.handleHashChange();
  }

  private handleHashChange(): void {
    const hash = window.location.hash.replace('#', '') || '/';
    const validRoutes: AppRoute[] = ['/', '/markets', '/decision', '/evidence', '/backtest', '/settings'];
    const targetRoute = validRoutes.includes(hash as AppRoute) ? (hash as AppRoute) : '/';
    store.setRoute(targetRoute);
  }

  private render(route: AppRoute): void {
    this.mountPoint.innerHTML = '';

    let view: HTMLElement;
    switch (route) {
      case '/':
        view = renderEntryView();
        break;
      case '/decision':
        view = renderDecisionView();
        break;
      case '/evidence':
        view = renderEvidenceView();
        break;
      case '/markets':
        view = renderMarketsView();
        break;
      case '/settings':
        view = renderSettingsView();
        break;
      case '/backtest':
        view = renderBacktestView();
        break;
      default:
        view = renderEntryView();
    }

    this.mountPoint.appendChild(view);
    this.updateActiveNav(route);
  }

  private updateActiveNav(route: AppRoute): void {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      if (href === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
