import React from 'react';
import { Button, Image, ScrollView, Text, TextInput, View } from 'react-native';
const MyScreen = () => (
  <ScrollView style={{ padding: 16 }}>
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Image source={require('../../assets/images/favicon.png')} style={{ width: 100, height: 100 }} />
    </View>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Hello, React Native!</Text>
    <TextInput
      placeholder="Type here"
      style={{ borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 20 }}
    />
    <Button title="Press me" onPress={() => alert('Bem vindo Gabriel ao sistema!')} />
  </ScrollView>
);

export default MyScreen;