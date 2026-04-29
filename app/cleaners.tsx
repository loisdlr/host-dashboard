import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";

export default function CleanersScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner } = useRental();

  const confirmDelete = (id: string, name: string, swipeable: SwipeableMethods) => {
    Alert.alert(
      "Remove Cleaner",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => swipeable.close() },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            deleteCleaner(id);
            swipeable.close();
          } 
        },
      ]
    );
  };

  const renderRightActions = (
    prog: SharedValue<number>,
    drag: SharedValue<number>,
    swipeable: SwipeableMethods,
    id: string,
    name: string
  ) => {
    const styleAnimation = useAnimatedStyle(() => ({
      transform: [{ translateX: drag.value + 80 }],
    }));

    return (
      <Reanimated.View style={styleAnimation}>
        <Pressable
          onPress={() => confirmDelete(id, name, swipeable)}
          style={[styles.deleteAction, { backgroundColor: c.destructive }]}
        >
          <Feather name="trash-2" size={20} color="white" />
        </Pressable>
      </Reanimated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Cleaners"
        subtitle={`${cleaners.length} active personnel`}
        rightIcon="plus"
        onRightPress={() => router.push("/cleaner/new")}
      />

      <FlatList
        data={cleaners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
          gap: 12,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="user-plus"
            title="No cleaners found"
            description="Add your first cleaner to start assigning tasks."
          />
        }
        renderItem={({ item }) => (
          <ReanimatedSwipeable
            friction={2}
            rightThreshold={40}
            renderRightActions={(prog, drag, swipeable) =>
              renderRightActions(prog, drag, swipeable, item.id, item.name)
            }
          >
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <Pressable
                onPress={() => router.push(`/cleaner/${item.id}`)}
                style={({ pressed }) => [
                  styles.cleanerRow,
                  { backgroundColor: pressed ? c.accent : c.card }
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: c.muted }]}>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>
                    {item.name.substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                    {item.phone || "No phone number"}
                  </Text>
                </View>

                <Feather name="chevron-right" size={18} color={c.mutedForeground} />
              </Pressable>
            </Card>
          </ReanimatedSwipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cleanerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAction: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 12, // Matches Card radius
    borderBottomRightRadius: 12,
  },
});