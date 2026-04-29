import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallStatus =
  | "unsupported"
  | "ios-instructions"
  | "manual"
  | "available"
  | "installing"
  | "installed";

interface InstallPromptState {
  status: InstallStatus;
  promptInstall: () => Promise<void>;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)");
  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mql?.matches) || iosStandalone;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [status, setStatus] = useState<InstallStatus>("unsupported");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    if (isStandalone()) {
      setStatus("installed");
      return;
    }

    if (isIosSafari()) {
      setStatus("ios-instructions");
    } else {
      setStatus("manual");
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setStatus("available");
    };

    const onInstalled = () => {
      setDeferred(null);
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    setStatus("installing");
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setStatus("installed");
      } else {
        setStatus("available");
      }
    } catch {
      setStatus("available");
    } finally {
      setDeferred(null);
    }
  }, [deferred]);

  return { status, promptInstall };
}
