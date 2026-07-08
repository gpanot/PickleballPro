/**
 * Imported first from App.js so production builds (TestFlight, App Store, release APK)
 * do not emit console.log noise. console.warn / console.error are unchanged.
 */
if (!__DEV__) {
  console.log = () => {};
}
