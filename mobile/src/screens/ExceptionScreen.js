import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image as ImageIcon, Send, X, Camera as CameraIcon, Hash } from 'lucide-react-native';
import axios from 'axios';

const ExceptionScreen = ({ route, navigation }) => {
  const { inbound, outboundLineId, po_no } = route.params || {};
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setImage(data.uri);
      setShowCamera(false);
    }
  };

  const submitException = async () => {
    if (!note || !image) {
      Alert.alert('Error', 'Please provide both a picture and a note.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload the image first
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        name: 'exception.jpg',
        type: 'image/jpeg',
      });

      console.log('MOBILE: Uploading image...');
      const uploadResp = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = uploadResp.data.url;
      console.log('MOBILE: Image uploaded:', imageUrl);

      // 2. Submit the exception
      if (outboundLineId) {
        await axios.post(`/api/outbound/exceptions/${outboundLineId}`, {
          note,
          image: imageUrl
        });
      } else {
        await axios.post(`/api/inbound/${inbound.id}/exceptions`, {
          note,
          image: imageUrl
        });
      }

      Alert.alert('Success', 'The exception has been reported and logged.');
      navigation.goBack();
    } catch (err) {
      console.error('MOBILE Exception Submit Error:', err);
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Error', 'Camera access is required to take pictures.');
        return;
      }
    }
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
              <X color="white" size={30} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>REPORT EXCEPTION</Text>
            {(inbound?.po_no || po_no) && (
              <View style={styles.poBadge}>
                <Hash color="#ef4444" size={10} />
                <Text style={styles.poText}>{inbound?.po_no || po_no}</Text>
              </View>
            )}
          </View>
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
            <TouchableOpacity style={styles.uploadBox} onPress={handleOpenCamera}>
              <CameraIcon color="#94a3b8" size={40} />
              <Text style={styles.uploadText}>Tap to Capture Evidence</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Detailed Note</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe the issue (e.g., Damaged box / Missmatching quantity)"
            placeholderTextColor="#64748b"
            multiline={true}
            numberOfLines={6}
            value={note}
            onChangeText={(text) => setNote(text)}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={submitException}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send color="white" size={20} />
                <Text style={styles.submitText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, backgroundColor: '#1e293b', paddingTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  title: { color: 'white', fontSize: 18, fontWeight: '800' },
  poBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  poText: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
  subtitle: { color: '#94a3b8', fontSize: 13 },
  content: { padding: 20 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  uploadBox: { height: 180, borderStyle: 'dashed', borderWidth: 2, borderColor: '#334155', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  uploadText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { height: 250, borderRadius: 12, width: '100%' },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 20 },
  input: { backgroundColor: '#1e293b', color: 'white', borderRadius: 12, padding: 15, fontSize: 16, height: 120, textAlignVertical: 'top', borderBottomWidth: 2, borderColor: '#334155' },
  submitBtn: { marginTop: 30, backgroundColor: '#d32f2f', padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
  closeBtn: { position: 'absolute', top: 50, right: 20 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', padding: 5 },
  captureInner: { flex: 1, borderRadius: 30, borderWidth: 2, borderColor: '#d32f2f' }
});

export default ExceptionScreen;
