import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function CleanersScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner, updateCleaner, addCleaner } = useRental();
  
  const [isAddVisible, setAddVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCleaner({ 
        name: newName.trim(), 
        phone: "", 
        ratePerClean: 450 
    });
    setNewName("");
    setAddVisible(false);
  };

  const handleUpdate = () => {
    if (selectedCleaner && selectedCleaner.id) {
      // Logic fix: id first, then the patch object
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  // --- THE DELETE FIX ---
  const handleConfirmDelete = (id: string, name: string) => {
    console.log("Attempting to delete ID:", id); // Check your terminal for this!
    
    Alert.alert(
      "Remove Staff",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            if (!id) return console.error("No ID found for this cleaner!");
            deleteCleaner(id); 
          } 
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Cleaners" 
        rightIcon="plus"
        onRightPress={() => setAddVisible(true)}
      />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
        {cleaners.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: c.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>ID: {item.id.slice(0, 5)}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Pressable onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}>
                <Feather name="edit-2" size={20} color={c.primary} />
              </Pressable>
              
              <Pressable onPress={() => handleConfirmDelete(item.id, item.name)}>
                <Feather name="trash-2" size={20} color={c.destructive} />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="New Staff" leftIcon="x" onLeftPress={() => setAddVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              placeholder="Name"
              placeholderTextColor="#999"
              value={newName}
              onChangeText={setNewName}
            />
            <Button label="Save Staff" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="Edit Staff" leftIcon="x" onLeftPress={() => setEditVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name}
              onChangeText={(t) => setSelectedCleaner({...selectedCleaner, name: t})}
            />
            <Button label="Update Changes" onPress={handleUpdate} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 18, alignItems: 'center' },
  form: { padding: 20, gap: 15 },
  input: { borderWidth: 1, padding: 14, borderRadius: 10, fontSize: 16 }
});