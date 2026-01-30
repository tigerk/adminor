import { defineStore } from "pinia";
import { store } from "@/store";

interface LockState {
  isLocked: boolean;
  errorCount: number;
  lockUntil: number;
}

export const useLockStore = defineStore("pure-lock", {
  // 修正点：ID 作为第一个参数
  state: (): LockState => ({
    isLocked: localStorage.getItem("isLocked") === "true",
    errorCount: 0,
    lockUntil: 0
  }),
  actions: {
    setLock(status: boolean) {
      this.isLocked = status;
      localStorage.setItem("isLocked", String(status));
      if (!status) {
        this.errorCount = 0;
        this.lockUntil = 0;
      }
    },
    handleError() {
      this.errorCount++;
      if (this.errorCount >= 3) {
        this.lockUntil = Date.now() + 60 * 1000;
      }
    }
  }
});

export function useLockStoreHook() {
  return useLockStore(store);
}
