/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App, { createConnection } from './src/app';
import { name as appName } from './app.json';
import store from './src/state'
import { Provider } from 'react-redux';
import Background from './src/Background';

const Root = () => {
    return (
        <Provider store={store}>
            <App />
        </Provider>
    );
};

const BackgroundTask = async () => {
    console.log(
        'Receiving Background Event!---------------------------------------------------'
    );
    console.log('intervalId', intervalId);
    await createConnection();
    const isBackgroundServerRunning = await Background.isServiceRunning();
    if (!isBackgroundServerRunning) {
        await Background.startService()
    }

    if (intervalId) {
        clearInterval(intervalId)
    }

    const intervalId = setInterval(() => {
        try {
            const newClient = store.getState().videoControls.client;
            console.log('store', store);
            console.log('newClient', newClient);
            if (
              !newClient?.localAddress ||
              Object.keys(newClient?.address()).length === 0 ||
              !newClient?.localPort
            ) {
              console.log(
                newClient?.localAddress,
                newClient?.localAddress,
                newClient?.address()
              );
              createConnection();
            }
          } catch (err) {
            createConnection();
          }
    }, 10000);
    console.log(
        'Processed Background Event!---------------------------------------------------'
    );
};

AppRegistry.registerHeadlessTask('Background', () => BackgroundTask);
AppRegistry.registerComponent(appName, () => Root);
