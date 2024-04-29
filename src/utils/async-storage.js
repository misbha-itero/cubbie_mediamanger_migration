// Async Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const setAsyncStorageItem = async (itemKey, itemValue) => {
  await AsyncStorage.setItem(itemKey, itemValue);
};

const getAsyncStorageItem = async itemKey => {
  const item = await AsyncStorage.getItem(itemKey);
  return item;
};

const removeAsyncStorageItem = async itemKey => {
  const item = await AsyncStorage.removeItem(itemKey);
  return item;
};

const getAllAsyncStorageKey = async () => {
  const keys = await AsyncStorage.getAllKeys();
  return keys;
};

const removeMultipleAsyncStorageItem = async (keys) => {
  const item = await AsyncStorage.multiRemove(keys);
  return item;
};


export default {
  setAsyncStorageItem,
  getAsyncStorageItem,
  removeAsyncStorageItem,
  getAllAsyncStorageKey,
  removeMultipleAsyncStorageItem
}
