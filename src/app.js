// App
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet, Image, Dimensions, Animated, Button, StatusBar, SafeAreaView, AppState } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import permissions from './permissions';
import * as ScopedStorage from 'react-native-scoped-storage';
import { contentUri, storageKeys } from './contants';
import { AsyncStorage } from './utils';
import { Modal } from './components';
import { useDispatch, useSelector } from 'react-redux';
import { AudioService, VideoService } from './services';
import RNFS from 'react-native-fs';
import { setClient, setIsShowFadeOut } from './state/videoControls';
import store from './state';
import axios from 'axios';
import Immersive from 'react-native-immersive';
import FullScreenChz from 'react-native-fullscreen-chz';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import firebase from '@react-native-firebase/app';

const { checkPermission } = permissions;
const { setAsyncStorageItem, getAsyncStorageItem, removeAsyncStorageItem } = AsyncStorage;
const { audioService } = AudioService;
const { videoService } = VideoService;

Sound.setCategory('Playback');

const clientType = 'mediaManager';

const firebaseConfig = {
  apiKey: 'AIzaSyBpsnzA97voLYfVzVtHhhpl-4OGK_Rzwbc',
  // authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'cubbie-light',
  appId: '1:531451339187:android:801de2a12ebd5281d7ebc6',
  messagingSenderId: '531451339187',
  // authDomain: '.firebaseapp.com',
  databaseURL:
    'https://cubbie-light-default-rtdb.firebaseio.com/',
  storageBucket: 'cubbie-light.appspot.com',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  }

  
export const createConnection = async () => {
  try {
    const client = await TcpSocket.createConnection(
      { port: 3000, host: 'localhost' },
      () => {
        console.log('Connected to server');

        // Send a message to the server
        // client.write('Hello from client');
        const registrationMessage = JSON.stringify({
          type: 'register',
          clientType
        });
        client?.on('data', async data => {
          const message = data.toString('utf8');
          console.log('Received:', message);

          const parsedMessage = JSON.parse(message)

          if (parsedMessage.type === 'audio') {
            audioService(parsedMessage);
          }

          if (parsedMessage.type === 'video') {
            videoService(parsedMessage);
          }

          if (JSON.parse(parsedMessage?.command)?.action === 'stop_playlist') {
            videoService(parsedMessage);
            audioService(parsedMessage);
          }

          const isPlaylistCompleted = await getAsyncStorageItem(
            'IS_PLAYLIST_COMPLETED'
          );

          const { isShowFadeOut } = store.getState().videoControls
          if (
            JSON.parse(parsedMessage?.command)?.action === 'stop_playlist' &&
            !isShowFadeOut &&
            !isPlaylistCompleted
          ) {
            await setAsyncStorageItem('IS_PLAYLIST_COMPLETED', 'true');
            store.dispatch(setIsShowFadeOut(true));
          }

          if (JSON.parse(parsedMessage?.command)?.action === 'start_playlist') {
            await removeAsyncStorageItem('IS_PLAYLIST_COMPLETED');
          }
        })

        client?.on('error', error => {
          console.log('Connection error:', error);
        });

        client?.on('ready', error => {
          console.log('Connection Ready!')
        });

        client?.on('close', error => {
          console.log('Connection Closed!')
          store.dispatch(setClient(null))
        });

        client?.on('end', error => {
          console.log('Connection ended!')
        });

        client.write(registrationMessage);
        console.log('client', client.address());

        store.dispatch(setClient(client))
      }
    );
  } catch (error) {
    console.log('error', error);
  }
}

export const sendMessage = message => {
  const { client } = store.getState().videoControls
  if (client) {
    client.write(message);
  } else {
    console.log('Client not available');
  }
};

function App() {
  const [isExpired, setIsExpired] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isShowModal, setIsShowModal] = useState({
    isVisible: false,
    content: ''
  });
  let audio;
  const { currentAudio, volume, isAudioPaused, audios } = useSelector(
    state => state.audioControls
  );
  const { currentVideo, isVideoPaused, isShowFadeOut, client } = useSelector(
    state => state.videoControls
  );

  const dispatch = useDispatch();

  const checkExpiration = async () => {
    try {
      const expirationDateTime = new Date('2024-04-30T012:00:00+05:30') // Set expiration date and time (Mar 26 12 PM IST)
      const response = await axios.get(
        'http://ec2-3-249-38-68.eu-west-1.compute.amazonaws.com:7000/mediaBox/currentDateTime'
      )
      const { currentDateTime } = response.data
      const current = new Date(currentDateTime)
      console.log(current, expirationDateTime, current >= expirationDateTime)
      if (current >= expirationDateTime) {
        console.log('Time expired')
        setIsExpired(true)
        client?.end()
      } else {
        console.log('Time not expired')
        setIsExpired(false)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App is in the foreground, do your tasks here
        console.log('App is in the foreground');
        SystemNavigationBar.navigationHide()
        FullScreenChz.enable()
      }
    };

    // Subscribe to app state changes
    AppState.addEventListener('change', handleAppStateChange);
  }, [])

  useEffect(() => {
    checkExpiration(); // Initial check on component mount

    let timeout = setTimeout(function checkExpiry() {
      checkExpiration(); // Check expiration periodically
      timeout = setTimeout(checkExpiry, 60000); // Recursive call after 1 minute
    }, 60000);

    // Clean up
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isExpired) {
      checkPermission();
      createConnection()

      const intervalId = setInterval(() => {
      const newClient = store.getState().videoControls.client;
      if (!newClient?.localAddress || Object.keys(newClient?.address()).length === 0 || !newClient?.localPort) {
        console.log(newClient?.localAddress, newClient?.localAddress, newClient?.address());
        createConnection();
      }
    }, 10000);

      return () => {
        // client.end();
      };
    }
  }, []);

  const getContentPath = (contentUri) => {
    const decodedUri = decodeURIComponent(contentUri);
    const uriParts = decodedUri.split('/primary:');

    return uriParts.length > 0 ? uriParts.pop() : '';
  };

  const getPermission = async (key) => {
    if (key) {
      const selectedDirectory = await ScopedStorage.openDocumentTree(true);
      const selectedPath = getContentPath(selectedDirectory.uri);

      if (selectedPath !== 'Download/Cubbie') {
        return Alert.alert(
          'Choose the correct path',
          `The selected path "${selectedPath}" is incorrect. \n\n Please Select \n"Internal Storage/Download/Cubbie"`,
          [
            { text: 'Cancel' },
            {
              text: 'Choose the path',
              onPress: () => {
                getPermission(key);
              },
            },
          ],
        );
      }

      if (selectedDirectory) {
        const persistedUris = await ScopedStorage.getPersistedUriPermissions();

        let isExpectedDirectory = false;
        if (contentUri.CUBBIE_PATH === selectedDirectory.uri) {
          isExpectedDirectory = true;
          await setAsyncStorageItem(storageKeys.cubbieFolder, JSON.stringify(selectedDirectory));
        }

        if (isExpectedDirectory) {
          setIsShowModal({ isVisible: false, content: '' });
          return selectedDirectory;
        }
        await ScopedStorage.releasePersistableUriPermission(persistedUris[persistedUris.length - 1]);
        setIsShowModal({ isVisible: true, content: `Download/Cubbie` })
      }
    }
  }

  async function getAudioAndVideoPermission() {
    setHasPermission(false);
    const hasCubbiePathAccess = await getAsyncStorageItem(storageKeys.cubbieFolder);

    if (!hasCubbiePathAccess) {
      if (!isShowModal.isVisible && !isShowModal.content) {
        setIsShowModal({ isVisible: true, content: 'Download/Cubbie' })
      }

      if (!isShowModal.isVisible && isShowModal.content) {
        await getPermission(storageKeys.cubbieFolder);
      }
    } else {
      setHasPermission(true)
    }
  }

  useEffect(() => {
    if (!isExpired) {
      getAudioAndVideoPermission();
    }
  }, [isShowModal]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: false
    }).start(() => {
      fadeAnim.resetAnimation();
      dispatch(setIsShowFadeOut(false));
    });
  };

  useEffect(() => {
    if (!isExpired) {
      if (isShowFadeOut) {
        fadeOut();
      }
    }
  }, [isShowFadeOut]);

  if (isExpired) {
    return (
      <View style={[styles.modal, { opacity: isExpired ? 1 : 0 }]}>
        <Text style={styles.popupText}>The app license has been expired</Text>
      </View>
    );
  }

  return (
    // <SafeAreaView style={{ backgroundColor: 'red', }}>
    //   <StatusBar hidden translucent />
    //   {!hasPermission ? (
    //     <Modal isVisible={isShowModal.isVisible}>
    //       <View style={styles.centeredView}>
    //         <View style={styles.modalView}>
    //           <Text style={styles.modalText}>
    //             Please Select {''}
    //             <Text style={styles.pathText}>{isShowModal.content}</Text> path
    //           </Text>
    //           <TouchableOpacity
    //             style={[styles.button, styles.buttonClose]}
    //             onPress={() =>
    //               setIsShowModal({ ...isShowModal, isVisible: false })
    //             }>
    //             <Text style={styles.textStyle}>Ok</Text>
    //           </TouchableOpacity>
    //         </View>
    //       </View>
    //     </Modal>
    //   ) : (
    //     <View style={{ width: '100%', height: '100%', backgroundColor: 'red' }}>
    //       {currentVideo?.uri && currentAudio?.uri && (
    //         <View>
    //           <Image source={require('./assets/images/Logo1.png')} resizeMode='stretch' style={{
    //             height: '100%',
    //             width: 'auto'
    //           }} />
    //         </View>
    //       )}
    //       {!currentVideo?.uri && (
    //         <Video
    //           // source={require('./assets/DeepSpace_1669715629266.mp4')}
    //           // source={{ uri: currentVideo?.uri }}
    //           source={{ uri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie%2FNightScene_1669715866144.mp4' }}
    //           style={styles.video}
    //           resizeMode="stretch"
    //           paused={isVideoPaused}
    //           repeat
    //           // fullscreen
    //           onError={err => console.log(err)}
    //           onLoad={() => console.log('load')}
    //           onBuffer={() => console.log('bufffer')}
    //         />
    //       )}
    //       {currentAudio?.uri && (
    //         <Video
    //           // source={require('./assets/DeepSpace_1669715629266.mp4')}
    //           source={{ uri: currentAudio?.uri }}
    //           // source={{ uri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie%2Fmedia%2Faudios/document/primary%3ADownload%2FCubbie%2Fmedia%2Faudios%2FSpring_In_My_Step.mp3' }}
    //           onError={err => console.log(err)}
    //           onLoad={() => console.log('load')}
    //           onBuffer={() => console.log('bufffer')}
    //           repeat
    //           volume={volume}
    //           paused={isAudioPaused}
    //         />
    //       )}
    //       {!currentVideo?.uri && !currentAudio?.uri && isShowFadeOut && (
    //         <Animated.View
    //           style={{
    //             ...StyleSheet.absoluteFillObject,
    //             backgroundColor: 'white',
    //             opacity: fadeAnim
    //           }}
    //         />
    //       )}
    //     </View>
    //   )}
    // </SafeAreaView>
    <View style={{ flex: 1 }}>
      <StatusBar hidden translucent barStyle={'default'} />
      {hasPermission && currentVideo?.uri && (
        <Video
          // source={require('./assets/DeepSpace_1669715629266.mp4')}
          source={{ uri: currentVideo?.uri }}
          // source={{ uri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie%2FNightScene_1669715866144.mp4' }}
          style={styles.video}
          resizeMode="stretch"
          paused={isVideoPaused}
          repeat
          onError={err => console.log(err)}
          onLoad={() => console.log('load')}
          onBuffer={() => console.log('bufffer')}
        />
      )}
      {hasPermission && currentAudio?.uri && (
        <Video
          // source={require('./assets/DeepSpace_1669715629266.mp4')}
          source={{ uri: currentAudio?.uri }}
          // source={{ uri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie%2Fmedia%2Faudios/document/primary%3ADownload%2FCubbie%2Fmedia%2Faudios%2FSpring_In_My_Step.mp3' }}
          onError={err => console.log(err)}
          onLoad={() => console.log('load')}
          onBuffer={() => console.log('bufffer')}
          repeat
          volume={volume}
          paused={isAudioPaused}
        />
      )}
      {hasPermission && !currentVideo.uri && !currentAudio?.uri && (
        <View>
          <Image
            source={require('./assets/images/Logo1.png')}
            resizeMode="stretch"
            style={{
              height: '100%',
              width: 'auto'
            }}
          />
        </View>
      )}
      {!hasPermission && (
        <View
          style={{
            height: '100%',
            width: 'auto',
            backgroundColor: '#000'
          }}>
          <Modal isVisible>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>
                  Please Select {''}
                  <Text style={styles.pathText}>
                    {isShowModal.content}
                  </Text>{' '}
                  path
                </Text>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() =>
                    setIsShowModal({ ...isShowModal, isVisible: false })
                  }>
                  <Text style={styles.textStyle}>Ok</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    height: '100%'
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    color: 'black',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'center'
  },
  pathText: {
    color: '#2196F3',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  waitTxt: {
    fontSize: 18,
    marginStart: 5,
    fontWeight: 'bold',
    alignSelf: 'center',
    lineHeight: 18
  },
  loadingBg: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 6,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  popupText: {
    fontSize: 20,
    color: 'white',
  },
});

export default App;
