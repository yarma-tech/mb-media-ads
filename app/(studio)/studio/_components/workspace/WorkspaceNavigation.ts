"use client";
import { usePathname, useSearchParams } from "next/navigation";

// Keep working context in the URL: reload, history and opening another tab agree.
export function useWorkspaceNavigation() {
  const params = useSearchParams();
  const pathname = usePathname();
  function href(path: string, patch: Record<string, string> = {}) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    return path + (query ? "?" + query : "");
  }
  function update(patch: Record<string, string>, replace = false) {
    // Read current URL, including keystrokes not rendered by React yet.
    const next = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.searchParams.set(key, value);
      else next.searchParams.delete(key);
    }
    const url = pathname + next.search;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }
  return { params, href, update };
}
