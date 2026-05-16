import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blivre.app',
  appName: 'B Livre',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: ['brane.pages.dev', 'brane-production-3c87.up.railway.app']
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystorePassword: null,
      keystoreAlias: null,
      keystoreAliasPassword: null
    }
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#050608'
    }
  }
};

export default config;
