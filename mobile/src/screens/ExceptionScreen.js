import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Image as ImageIcon, Send, X, Camera as CameraIcon } from 'lucide-react-native';

const ExceptionScreen = () => {
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [camera, setCamera] = useState(null);

  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync();
      setImage(data.uri);
      setShowCamera(false);
    }
  };

  const submitException = () => {
    if (!note || !image) {
      Alert.alert('Error', 'Please provide both a picture and a note.');
      return;
    }
    Alert.alert('Exception Reported', 'The exception has been sent to the inbound chatter.');
    setNote('');
    setImage(null);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <Camera style={styles.camera} type={type} ref={(ref) => setCamera(ref)}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
              <X color="white" size={30} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>REPORT EXCEPTION</Text>
        <Text style={styles.subtitle}>Document missing or broken items</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Evidence Picture</Text>
        {image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
              <X color="white" size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={() => setShowCamera(true)}>
            <CameraIcon color="#94a3b8" size={40} />
            <Text style={styles.uploadText}>Tap to Capture Evidence</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Detailed Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the issue (e.g., Damaged box / Missmatching quantity)"
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={6}
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitException}>
          <Send color="white" size={20} />
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 40, backgroundColor: '#1e293b', paddingTop: 60 },
  title: { color: 'white', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 14 },
  content: { padding: 20 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  uploadBox: { height: 200, borderStyle: 'dashed', borderWidth: 2, borderColor: '#334155', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  uploadText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { height: 300, borderRadius: 12, width: '100%' },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 20 },
  input: { backgroundColor: '#1e293b', color: 'white', borderRadius: 12, padding: 15, fontSize: 16, height: 120, textAlignVertical: 'top', borderBottomWidth: 2, borderColor: '#334155' },
  submitBtn: { marginTop: 30, backgroundColor: '#d32f2f', padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
  camera: { flex: 1, height: 800 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
  closeBtn: { position: 'absolute', top: 50, right: 20 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', padding: 5 },
  captureInner: { flex: 1, borderRadius: 35, borderWidth: 2, borderColor: '#d32f2f' }
});

export default ExceptionScreen;
