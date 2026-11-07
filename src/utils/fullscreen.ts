// Utility to force the kiosk app into Fullscreen mode automatically on launch
export function requestAppFullscreen(): Promise<void> | void {
  if (typeof document === 'undefined') return;

  if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
      return elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      return elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      return elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      return elem.msRequestFullscreen();
    }
  }
}

export function setupAutoFullscreen(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Attempt immediately upon launch
  requestAppFullscreen();

  // 2. Attach capture listeners for the very first interaction (tap, click, key) to satisfy browser gesture policies
  const handleInteraction = () => {
    requestAppFullscreen();
  };

  const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
  events.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { capture: true, passive: true });
  });

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, handleInteraction, { capture: true });
    });
  };
}
