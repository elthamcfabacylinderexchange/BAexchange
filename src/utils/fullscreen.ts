// Utility to force the kiosk app into Fullscreen mode automatically on launch without breaking auth gestures
let isAuthFlowActive = false;

export function setAuthFlowActive(active: boolean) {
  isAuthFlowActive = active;
}

export function requestAppFullscreen(): Promise<void> | void {
  if (typeof document === 'undefined' || isAuthFlowActive) return;

  if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
    const elem = document.documentElement as any;
    try {
      if (elem.requestFullscreen) {
        return elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        return elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        return elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        return elem.msRequestFullscreen();
      }
    } catch {}
  }
}

export function exitAppFullscreen(): Promise<void> | void {
  if (typeof document === 'undefined') return;
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      return document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
      return (document as any).webkitExitFullscreen();
    }
  } catch {}
}

export function setupAutoFullscreen(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Attempt immediately upon launch
  requestAppFullscreen();

  // 2. Attach non-capturing listener on user interactions, ignoring auth buttons and inputs
  const handleInteraction = (e: Event) => {
    if (isAuthFlowActive) return;

    // NEVER consume user gesture if user is interacting with auth or interactive controls
    const target = e.target as HTMLElement | null;
    if (target) {
      if (
        target.closest('button') ||
        target.closest('[data-auth-action]') ||
        target.closest('[role="dialog"]') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('form') ||
        target.closest('.no-auto-fullscreen')
      ) {
        return;
      }
    }

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      requestAppFullscreen();
    }
  };

  const events = ['pointerdown', 'touchstart', 'mousedown'];
  events.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { passive: true });
  });

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, handleInteraction);
    });
  };
}

