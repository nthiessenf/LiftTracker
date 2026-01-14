import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function TestUI() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HELLO WORLD 12345</Text>
      
      <Card>
        <Text style={styles.text}>Default Card</Text>
      </Card>

      <Card variant="elevated">
        <Text style={styles.text}>Elevated Card</Text>
      </Card>

      <Card variant="accent">
        <Text style={styles.text}>Accent Card</Text>
      </Card>

      <Card onPress={() => console.log('Pressed!')}>
        <Text style={styles.text}>Pressable Card - Tap me!</Text>
      </Card>

      <Button title="Primary Button" onPress={() => console.log('Primary')} />
      
      <View style={{ height: 16 }} />
      
      <Button title="Secondary Button" variant="secondary" onPress={() => console.log('Secondary')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});

