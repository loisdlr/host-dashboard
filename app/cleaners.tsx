import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ..., TouchableOpacity, SafeAreaView } from 'react-native';

export default function CleanersScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner, updateCleaner, addCleaner } = useRental();

  const [isAddVisible, setAddVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const openEdit = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner });
    setEditVisible(true);
  };

  const handleUpdate = () => {
    if (selectedCleaner?.id && selectedCleaner.name?.trim()) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleDelete = () => {
  console.log("Delete button pressed! ID:", selectedCleaner?.id);   // Check console
  // ... rest of your code
};

    if (!selectedCleaner?.id) {
      Alert.alert("Error", "No staff selected");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Delete "${selectedCleaner.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCleaner(selectedCleaner.id);
            setEditVisible(false);
            setSelectedCleaner(null);
          },
        },
      ]
    );
  };

  const handleAdd = () => {
    if (newName.trim()) {
      addCleaner({ name: newName.trim() });
      setAddVisible(false);
      setNewName("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Staff"
        rightIcon="plus"
        onRightPress={() => setAddVisible(true)}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {cleaners.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 100 }}>
            No staff members yet
          </Text>
        ) : (
          cleaners.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openEdit(item)}
              style={{
                padding: 18,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ fontSize: 10, color: '#999' }}>
                  ID: {item.id ? String(item.id).slice(0, 8) : 'MISSING'}
                </Text>
              </View>
              <Feather name="edit-2" size={20} color={c.primary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* EDIT MODAL - Ultra Simple & Reliable */}
<Modal 
  visible={isEditVisible} 
  animationType="slide" 
  transparent={false}
>
  <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <View style={{ flex: 1, padding: 20, paddingTop: 80 }}>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30 }}>
        Edit Staff
      </Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: c.border || '#ccc',
          borderRadius: 12,
          padding: 16,
          fontSize: 18,
          marginBottom: 40,
          color: c.foreground,
        }}
        value={selectedCleaner?.name || ''}
        onChangeText={(t) => setSelectedCleaner((prev: any) => prev ? { ...prev, name: t } : null)}
        placeholder="Staff name"
        autoFocus
      />

      {/* Update & Cancel Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 50 }}>
        <TouchableOpacity 
          onPress={() => {
            setEditVisible(false);
            setSelectedCleaner(null);
          }}
          style={{
            flex: 1,
            padding: 16,
            backgroundColor: '#f3f4f6',
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#666', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleUpdate}
          style={{
            flex: 1,
            padding: 16,
            backgroundColor: '#007AFF',
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* DELETE BUTTON - The one we're testing */}
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.6}
        style={{
          padding: 18,
          backgroundColor: '#fee2e2',
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#ef4444',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Feather name="trash-2" size={24} color="#ef4444" />
        <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 17 }}>
          Remove Staff Member
        </Text>
      </TouchableOpacity>

    </View>
  </SafeAreaView>
</Modal>

      {/* ADD MODAL - unchanged for now */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30 }}>New Staff</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: c.border || '#ccc',
                borderRadius: 12,
                padding: 16,
                fontSize: 18,
                marginBottom: 30,
                color: c.foreground,
              }}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => { setAddVisible(false); setNewName(""); }}
                style={{ flex: 1, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#666' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={{ flex: 1, padding: 16, backgroundColor: '#007AFF', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}