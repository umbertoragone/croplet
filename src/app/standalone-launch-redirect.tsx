"use client";

import { useEffect } from "react";

function isStandaloneLaunch() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    // Safari on iOS exposes standalone mode here for homescreen launches.
    ("standalone" in window.navigator &&
      window.navigator.standalone === true) ||
    document.referrer.startsWith("android-app://")
  );
}

export default function StandaloneLaunchRedirect() {
  useEffect(() => {
    if (!isStandaloneLaunch() || window.location.pathname !== "/") {
      return;
    }

    window.location.replace("/web");
  }, []);

  return null;
}
