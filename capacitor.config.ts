import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsundoku.app',
  appName: 'Tsundoku',
  webDir: 'dist',
  server: {
    // This points to the Lovable preview URL for hot reload.
    // In production, this block should be removed or commented out.
    url: 'https://narro-learn-dash.lovable.app',
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
