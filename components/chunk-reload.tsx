"use client";

import { useEffect } from "react";

const reloadKey = "sira_chunk_reload";

function failedChunk(message: string) {
  return message.includes("ChunkLoadError") || message.includes("Loading chunk");
}

export function ChunkReload() {
  useEffect(() => {
    const timer = window.setTimeout(() => sessionStorage.removeItem(reloadKey), 10000);

    function reload() {
      if (sessionStorage.getItem(reloadKey) === "1") return;
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    }

    function onError(event: ErrorEvent) {
      if (failedChunk(event.message || "")) reload();
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
      if (!failedChunk(reason)) return;
      event.preventDefault();
      reload();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
