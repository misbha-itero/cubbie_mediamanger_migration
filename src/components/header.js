// Component Header
import React from 'react';
import { StyleSheet, useColorScheme, View, Text, Image } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import assets from '../assets';

export const Header = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: '#212121',
    color: '#fff'
  };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <Text style={[styles.title, backgroundStyle]}>Cubbie Media Manager</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    display: 'flex'
  },
  title: {
    fontWeight: '600',
    paddingLeft: 6,
    fontSize: 17,
    fontFamily: 'Avenir-Heavy'
  },
  image: {
    width: 100,
    height: 100
  }
});
