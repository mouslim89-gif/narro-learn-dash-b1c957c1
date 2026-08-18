import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initializeNativePlatform(darkMode: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Ensure the status bar is NOT overlaying the webview (as requested)
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Initial status bar style
    await StatusBar.setStyle({
      style: darkMode ? Style.Light : Style.Dark,
    });
    
    // Set background color to match theme
    await StatusBar.setBackgroundColor({
      color: darkMode ? '#111827' : '#F7F4EF',
    });

    // Hide the native splash screen after the JS app has hydrated
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 500);
  } catch (e) {
    console.warn('Native platform initialization failed:', e);
  }
}


export async function updateNativeStatusBar(darkMode: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({
      style: darkMode ? Style.Light : Style.Dark,
    });
    
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: darkMode ? '#111827' : '#F7F4EF',
      });
    }
  } catch (e) {
    console.error('Failed to update native status bar:', e);
  }
}
