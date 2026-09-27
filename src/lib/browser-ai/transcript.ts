"use client";
import { useSyncExternalStore } from "react";
import type { ChatTurn } from "@/lib/ai/types";

let turns: ChatTurn[] = [];
let claimedSeed = -1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Current on-device chat. Survives closing the chat panel. */
export function getTranscript() {
  return turns;
}

/** Replaces the on-device chat and notifies subscribers. */
export function setTranscript(next: ChatTurn[]) {
  turns = next;
  emit();
}

/** Subscribes to chat updates. The cleanup removes that listener. */
export function subscribeTranscript(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Claims a seeded message so only one mounted chat sends it.
 * Returns false when that seed was already claimed.
 */
export function claimChatSeed(id: number) {
  if (claimedSeed === id) return false;
  claimedSeed = id;
  return true;
}

/** Lets a remounted chat handle a seed that never started generating. */
export function releaseChatSeed(id: number) {
  if (claimedSeed === id) claimedSeed = -1;
}

/** React view of the shared on-device transcript. */
export function useTranscript() {
  return useSyncExternalStore(
    subscribeTranscript,
    getTranscript,
    getTranscript,
  );
}
