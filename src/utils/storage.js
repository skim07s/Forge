import { createMMKV } from "react-native-mmkv";

const STORAGE_ID = "forge-mmkv-storage";
const mmkv = createMMKV({ id: STORAGE_ID });

export const appStorage = {
  getItem: async (key) => mmkv.getString(key) ?? null,

  setItem: async (key, value) => {
    mmkv.set(key, value);
  },

  removeItem: async (key) => {
    mmkv.remove(key);
  },
};
