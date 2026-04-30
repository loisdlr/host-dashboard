import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Modal, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert 
} from 'react-native';
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
  
  // Ensure these functions are correctly destructured from your context
  const { cleaners, deleteCleaner, updateCleaner, addCleaner } = useRental();
  
  const [isAddVisible, setAddVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [newName, setNewName] = useState("");

  // --- ADD LOGIC ---
  const handleAdd = () => {
    if (!newName.trim()) return Alert.alert("Error", "Name is required.");
    addCleaner({ name: newName.trim() });
    setNewName("");
    setAddVisible(false);
  };

  // --- EDIT LOGIC (The "Save" Fix) ---
  const handleUpdate = () => {
    if (selectedCleaner && selectedCleaner.name.trim()) {
      // FIX: Your context expects (id, patch)
      updateCleaner(selectedCleaner.id, { 
        name: selectedCleaner.name.trim(),
        phone: selectedCleaner.phone,
        ratePerClean: selectedCleaner.ratePerClean 
      }); 
      
      setEditVisible(false);
      setSelectedCleaner(null);
    } else {
      Alert.alert("Error", "Name is required.");
    }
  };

  // --- UPDATED DELETE LOGIC ---
  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            // This is now correctly passing just the ID string
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
        subtitle={`${cleaners.length} staff members`} 
        rightIcon="plus"
        onRightPress={() => setAddVisible(true)}
      />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
        {cleaners.length === 0 ? (
           <View style={styles.empty}>
             <Feather name="users" size={48} color={c.mutedForeground} />
             <Text style={{ color: c.mutedForeground, marginTop: 12 }}>No staff registered.</Text>
           </View>
        ) : (
          cleaners.map((item) => (
            <Card key={item.id} style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                <Text style={{ color: c.primary, fontWeight: '700' }}>{item.name?.[0]?.toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600', color: c.foreground }}>{item.name}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable 
                  onPress={() => { 
                    setSelectedCleaner({...item}); // Create a copy to edit
                    setEditVisible(true); 
                  }} 
                  style={styles.btn}
                >
                  <Feather name="edit-2" size={18} color={c.primary} />
                </Pressable>
                
                <Pressable 
                  onPress={() => confirmDelete(item.id, item.name)} 
                  style={styles.btn}
                >
                  <Feather name="trash-2" size={18} color={c.destructive} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="Add Staff" leftIcon="x" onLeftPress={() => setAddVisible(false)} />
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              placeholder="Enter name"
              value={newName}
              onChangeText={setNewName}
            />
            <Button label="Save New Staff" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="Edit Staff" leftIcon="x" onLeftPress={() => setEditVisible(false)} />
          <View style={styles.form}>
            <Text style={styles.label}>Update Name</Text>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name}
              onChangeText={(t) => setSelectedCleaner({...selectedCleaner, name: t})}
            />
            <Button label="Save Changes" onPress={handleUpdate} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 14 },
  btn: { padding: 4 },
  form: { padding: 20, gap: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#888', textTransform: 'uppercase' },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, fontSize: 16 },
  empty: { alignItems: 'center', marginTop: 120 }
});