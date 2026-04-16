// Ad Integration Service
// Supports: Adstera, Monotag, Cmpgrip, Wannaads and other ad networks

export interface AdConfig {
  network: string;
  code: string;
  format: 'banner' | 'popup' | 'interstitial' | 'video' | 'native';
  enabled: boolean;
  weight: number;
}

export interface AdPlacement {
  id: string;
  name: string;
  type: 'banner' | 'popup' | 'interstitial' | 'video' | 'native';
  active: boolean;
  rotationEnabled: boolean;
}

// Your ad network configurations
export const adConfigs: Record<string, AdConfig> = {
  adstera: {
    network: 'Adstera',
    code: 'YOUR_ADSTERA_CODE', // Replace with your Adstera code
    format: 'popup',
    enabled: true,
    weight: 25
  },
  monotag: {
    network: 'Monotag',
    code: 'YOUR_MONOTAG_CODE', // Replace with your Monotag code
    format: 'banner',
    enabled: true,
    weight: 25
  },
  cmpgrip: {
    network: 'Cmpgrip',
    code: 'YOUR_CMPGRIP_CODE', // Replace with your Cmpgrip code
    format: 'interstitial',
    enabled: true,
    weight: 25
  },
  wannaads: {
    network: 'Wannaads',
    code: 'YOUR_WANNAADS_CODE', // Replace with your Wannaads code
    format: 'native',
    enabled: true,
    weight: 25
  }
};

class AdService {
  private impressions: number = 0;
  private clicks: number = 0;
  private lastAdShow: Date | null = null;

  // Initialize ad networks
  initializeAds(): void {
    // Load Adstera script
    this.loadScript('adstera', 'https://cdn.adstara.com/ads/' + adConfigs.adstera.code + '/widget.js');

    // Load Monotag script
    this.loadScript('monotag', 'https://cdn.monotag.com/ads/' + adConfigs.monotag.code + '/tag.js');

    // Load Cmpgrip script
    this.loadScript('cmpgrip', 'https://cdn.cmpgrip.com/ads/' + adConfigs.cmpgrip.code + '/display.js');

    // Load Wannaads script
    this.loadScript('wannaads', 'https://cdn.wannaads.com/ads/' + adConfigs.wannaads.code + '/feed.js');
  }

  private loadScript(id: string, src: string): void {
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  }

  // Show ad based on rotation system
  showAd(placement: AdPlacement): AdConfig | null {
    const activeAds = Object.values(adConfigs).filter(config => config.enabled);

    if (activeAds.length === 0) return null;

    // Weighted random selection
    const totalWeight = activeAds.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;

    for (const ad of activeAds) {
      random -= ad.weight;
      if (random <= 0) {
        this.renderAd(ad, placement);
        return ad;
      }
    }

    return activeAds[0];
  }

  private renderAd(ad: AdConfig, placement: AdPlacement): void {
    const container = document.getElementById(`ad-${placement.id}`);
    if (!container) return;

    switch (ad.format) {
      case 'banner':
        container.innerHTML = `
          <div class="ad-banner" data-network="${ad.network}">
            <a href="#" onclick="window.open('${ad.code}', '_blank'); return false;">
              <img src="https://via.placeholder.com/728x90?text=${encodeURIComponent(ad.network + ' Ad')}" alt="Advertisement">
            </a>
          </div>
        `;
        break;

      case 'popup':
        this.showPopupAd(ad);
        break;

      case 'interstitial':
        this.showInterstitialAd(ad);
        break;

      case 'native':
        container.innerHTML = `
          <div class="ad-native" data-network="${ad.network}">
            <span class="ad-label">Advertisement</span>
            <div class="ad-content">
              <a href="#" onclick="window.open('${ad.code}', '_blank'); return false;">
                <img src="https://via.placeholder.com/300x250?text=${encodeURIComponent(ad.network + ' Native Ad')}" alt="Advertisement">
              </a>
            </div>
          </div>
        `;
        break;
    }

    this.impressions++;
    this.lastAdShow = new Date();
  }

  private showPopupAd(ad: AdConfig): void {
    const popup = window.open('', 'popup', 'width=600,height=400');
    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advertisement</title>
          <style>
            body { margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f0f0; }
            a { display: block; }
            img { max-width: 100%; max-height: 100%; }
          </style>
        </head>
        <body>
          <a href="${ad.code}" target="_blank">
            <img src="https://via.placeholder.com/580x360?text=${encodeURIComponent(ad.network + ' Popup Ad')}" alt="Advertisement">
          </a>
        </body>
        </html>
      `);
      this.scheduleAdClose(popup);
    }
  }

  private showInterstitialAd(ad: AdConfig): void {
    const overlay = document.createElement('div');
    overlay.id = 'interstitial-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 99999;
      display: flex; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = `
      <div style="text-align: center; color: white;">
        <a href="${ad.code}" target="_blank">
          <img src="https://via.placeholder.com/800x600?text=${encodeURIComponent(ad.network + ' Interstitial')}" alt="Advertisement" style="max-width: 90%; max-height: 90%;">
        </a>
        <br><br>
        <button onclick="this.closest('#interstitial-overlay').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (document.getElementById('interstitial-overlay')) {
        overlay.remove();
      }
    }, 30000); // Auto close after 30 seconds
  }

  private scheduleAdClose(popup: Window): void {
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
      }
    }, 15000);
  }

  // Track ad click
  trackClick(adNetwork: string): void {
    this.clicks++;

    // Send to Firebase
    import('./firebase').then(({ db }) => {
      import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
      addDoc(collection(db, 'ad_clicks'), {
        network: adNetwork,
        timestamp: serverTimestamp(),
        clickCount: 1
      });
    });
  }

  // Get ad statistics
  getStats(): { impressions: number; clicks: number; ctr: number } {
    const ctr = this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
    return {
      impressions: this.impressions,
      clicks: this.clicks,
      ctr: Math.round(ctr * 100) / 100
    };
  }
}

export const adService = new AdService();