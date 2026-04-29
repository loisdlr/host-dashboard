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

// Custom Components & Hooks
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function CleanersScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner, updateCleaner } = useRental();
  
  // State for handling the Edit Form
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [isEditVisible, setEditVisible] = useState(false);

  // --- ACTIONS ---

  const openEditForm = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner }); // Clone cleaner data into state
    setEditVisible(true);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Cleaner",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteCleaner(id) 
        }
      ]
    );
  };

  const handleSave = () => {
    if (selectedCleaner) {
      updateCleaner(selectedCleaner);
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Cleaners" subtitle={`${cleaners.length} active`} />
      
      <ScrollView 
        contentContainerStyle={{ 
          padding: 16, 
          paddingBottom: insets.bottom + 20,
          gap: 12 
        }}
      >
        {cleaners.length === 0 ? (
           <View style={styles.emptyContainer}>
             <Feather name="users" size={40} color={c.mutedForeground} />
             <Text style={{ color: c.mutedForeground, marginTop: 8 }}>No cleaners added yet.</Text>
           </View>
        ) : (
          cleaners.map((item) => (
            <Card key={item.id} style={styles.cleanerCard}>
              <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                <Text style={{ color: c.primary, fontWeight: '700' }}>
                  {item.name?.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600', fontSize: 16, color: c.foreground }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                  Cleaner ID: {item.id.slice(0, 8)}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable 
                  onPress={() => openEditForm(item)} 
                  style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <Feather name="edit-2" size={18} color={c.primary} />
                </Pressable>

                <Pressable 
                  onPress={() => confirmDelete(item.id, item.name)} 
                  style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <Feather name="trash-2" size={18} color={c.destructive} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* --- EDIT MODAL FORM --- */}
      <Modal 
        visible={isEditVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader 
            title="Edit Cleaner" 
            leftIcon="x" 
            onLeftPress={() => setEditVisible(false)} 
          />
          
          <View style={{ padding: 20, gap: 20 }}>
            <View>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={[
                  styles.input, 
                  { borderColor: c.border, color: c.foreground, backgroundColor: c.card }
                ]}
                value={selectedCleaner?.name}
                onChangeText={(text) => setSelectedCleaner({ ...selectedCleaner, name: text })}
                placeholder="Enter cleaner name"
                placeholderTextColor={c.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 10, gap: 10 }}>
              <Button label="Update Cleaner" onPress={handleSave} />
              <Button 
                label="Cancel" 
                variant="secondary" 
                onPress={() => setEditVisible(false)} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cleanerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12 
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 8 
  },
  iconBtn: { 
    padding: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: { 
    borderWidth: 1, 
    padding: 14, 
    borderRadius: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  }
});