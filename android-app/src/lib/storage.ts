import { Platform } from 'react-native';

let AsyncStorageModule: any = null;
try {
  // @ts-ignore
  AsyncStorageModule = typeof require !== 'undefined' ? require('@react-native-async-storage/async-storage') : null;
  if (AsyncStorageModule && AsyncStorageModule.default) {
    AsyncStorageModule = AsyncStorageModule.default;
  }
} catch (e) {
  // fallback if native module is not linked or not found
}

const memoryStorage: Record<string, string> = {};

export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (AsyncStorageModule?.getItem) {
        return await AsyncStorageModule.getItem(key);
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStorage[key] || null;
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (AsyncStorageModule?.setItem) {
        await AsyncStorageModule.setItem(key, value);
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      memoryStorage[key] = value;
    } catch (e) {
      memoryStorage[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (AsyncStorageModule?.removeItem) {
        await AsyncStorageModule.removeItem(key);
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      delete memoryStorage[key];
    } catch (e) {
      delete memoryStorage[key];
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (AsyncStorageModule?.multiRemove) {
        await AsyncStorageModule.multiRemove(keys);
        return;
      }
      for (const k of keys) {
        await this.removeItem(k);
      }
    } catch (e) {
      for (const k of keys) {
        delete memoryStorage[k];
      }
    }
  },
};

export default SafeStorage;
