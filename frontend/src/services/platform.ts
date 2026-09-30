export interface PlatformService {
  getPlatform(): string;
  getCurrentUserData(): string | null;
  openExternalLink(url: string): void;
  shareActivity(title: string, url: string): Promise<void>;
}
export class WebPlatformService implements PlatformService {
  getPlatform() {
    return "web";
  }
  getCurrentUserData() {
    return null;
  }
  openExternalLink(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async shareActivity(title: string, url: string) {
    if (navigator.share) await navigator.share({ title, url });
    else await navigator.clipboard.writeText(url);
  }
}

declare global {
  interface Window {
    WebApp?: { initData?: string; openLink?: (url: string) => void };
  }
}

export class MaxPlatformService implements PlatformService {
  getPlatform() {
    return "max";
  }
  getCurrentUserData() {
    return window.WebApp?.initData || null;
  }
  openExternalLink(url: string) {
    if (window.WebApp?.openLink) window.WebApp.openLink(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }
  async shareActivity(title: string, url: string) {
    if (navigator.share) await navigator.share({ title, url });
    else await navigator.clipboard.writeText(url);
  }
}

export const platformService: PlatformService = window.WebApp?.initData
  ? new MaxPlatformService()
  : new WebPlatformService();
