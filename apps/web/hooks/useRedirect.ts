"use client";
import { useRouter } from "next/navigation";

export function useRedirect() {
  const router = useRouter();
  return {
    goTo: (path: string) => router.push(path),
    replaceTo: (path: string) => router.replace(path),
    back:() => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
    preload:(path:string) => router.prefetch(path),
  };
}
