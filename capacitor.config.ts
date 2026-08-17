import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.tsundoku',
  appName: 'Tsundoku',
  webDir: 'dist',
  server: {
    // This points to the Lovable preview URL for hot reload.
    // In production, this block should be removed or commented out.
    url: 'https://34e6052a-072a-48df-b850-628e648a6614.lovable.app',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
