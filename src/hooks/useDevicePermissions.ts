import { useState, useCallback } from "react";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  storage: PermissionStatus;
}

export function useDevicePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: "prompt",
    location: "prompt",
    notifications: "prompt",
    storage: "prompt",
  });

  const checkAll = useCallback(async () => {
    const state: PermissionState = {
      camera: "prompt",
      location: "prompt",
      notifications: "prompt",
      storage: "prompt",
    };

    try {
      if (navigator.permissions) {
        const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
        state.camera = cam.state as PermissionStatus;
      }
    } catch { state.camera = "unsupported"; }

    try {
      if (navigator.permissions) {
        const geo = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        state.location = geo.state as PermissionStatus;
      }
    } catch { state.location = "unsupported"; }

    if ("Notification" in window) {
      state.notifications = Notification.permission as PermissionStatus;
    } else {
      state.notifications = "unsupported";
    }

    // Storage/persistent storage
    if (navigator.storage?.persisted) {
      const persisted = await navigator.storage.persisted();
      state.storage = persisted ? "granted" : "prompt";
    } else {
      state.storage = "unsupported";
    }

    setPermissions(state);
    return state;
  }, []);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissions(p => ({ ...p, camera: "granted" }));
      return true;
    } catch {
      setPermissions(p => ({ ...p, camera: "denied" }));
      return false;
    }
  }, []);

  const requestLocation = useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => { setPermissions(p => ({ ...p, location: "granted" })); resolve(true); },
        () => { setPermissions(p => ({ ...p, location: "denied" })); resolve(false); },
        { timeout: 10000 }
      );
    });
  }, []);

  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermissions(p => ({ ...p, notifications: result as PermissionStatus }));
    return result === "granted";
  }, []);

  const requestStorage = useCallback(async () => {
    if (!navigator.storage?.persist) return false;
    const granted = await navigator.storage.persist();
    setPermissions(p => ({ ...p, storage: granted ? "granted" : "denied" }));
    return granted;
  }, []);

  return { permissions, checkAll, requestCamera, requestLocation, requestNotifications, requestStorage };
}
