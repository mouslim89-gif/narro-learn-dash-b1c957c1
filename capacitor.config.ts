import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsundoku.app',
  appName: 'Tsundoku',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#F7F4EF",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
