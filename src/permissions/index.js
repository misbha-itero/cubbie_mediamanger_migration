import { Platform, PermissionsAndroid } from "react-native";
import { AsyncStorage } from "../utils";

const { getAllAsyncStorageKey, removeMultipleAsyncStorageItem } = AsyncStorage;

const removeAllAsyncStorage = async () => {
  const allKeys = await getAllAsyncStorageKey();
  console.log(allKeys);
  await removeMultipleAsyncStorageItem(allKeys)
}

const checkPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 30) {
      // Android 11 and higher
      const isStorageManager = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if (isStorageManager) {
        return true;
      } else {
        // Request for the permission
        try {
          await removeAllAsyncStorage();
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          // After the user responds to the request, you can check the permission status again.
          const isStorageManager = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          if (isStorageManager) {
            return true;
          } else {
            // The user denied the permission.
            return false;
          }
        } catch (err) {
          console.log(err);
          return false;
        }
      }
    } else {
      // Below Android 11
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        // The user denied the permission.
        return false;
      }
    }
  } else {
    // For non-Android platforms
    return true;
  }
};

export default {
  checkPermission
}