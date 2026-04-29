import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { formatMoney } from "@/utils/finance";
import type { Unit, UnitType } from "@/types";

export default function UnitsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, addUnit, updateUnit, deleteUnit, settings, bookings } =
    useRental();

  const [editing, setEditing] = useState<Unit | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<UnitType>("studio");
  const [rate, setRate] = useState(String(settings.studioRate));
  const [cleaning, setCleaning] = useState(String(settings.cleaningFee));

  const openNew = () => {
    setName("");
    setType("studio");
    setRate(String(settings.studioRate));
    setCleaning(String(settings.cleaningFee));
    setShowNew(true);
  };

  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setName(unit.name);
    setType(unit.type);
    setRate(String(unit.nightlyRate));
    setCleaning(String(unit.cleaningFee));
  };

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Enter a name");
      return;
    }
    const payload = {
      name: name.trim(),
      type,
      nightlyRate: Number(rate) || 0,
      cleaningFee: Number(cleaning) || 0,
    };
    if (editing) {
      updateUnit(editing.id, payload);
      setEditing(null);
    } else {
      addUnit(payload);
      setShowNew(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Units"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
        rightIcon="plus"
        onRightPress={openNew}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 12,
        }}
      >
        {units.map((u) => {
          const activeBookings = bookings.filter(
            (b) => b.unitId === u.id && b.status !== "cancelled",
          );
          return (
            <Card key={u.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {u.name}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {u.type === "studio" ? "Studio" : "1 Bedroom"} ·{" "}
                    {formatMoney(u.nightlyRate, settings.currency)}/night
                  </Text>
                </View>
                <Text
                  style={{
                    color: c.mutedForeground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                  }}
                >
                  {activeBookings.length} booking
                  {activeBookings.length === 1 ? "" : "s"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <Pressable
                  onPress={() => openEdit(u)}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: c.muted,
                      borderRadius: c.radius - 4,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather name="edit-2" size={14} color={c.foreground} />
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      marginLeft: 6,
                    }}
                  >
                    Edit
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    Alert.alert(
                      "Delete unit",
                      `Remove ${u.name}? Bookings will remain in history.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteUnit(u.id),
                        },
                      ],
                    )
                  }
                >
                  <Feather name="trash-2" size={16} color={c.mutedForeground} />
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Modal
        visible={showNew || editing !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowNew(false);
          setEditing(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader
            title={editing ? "Edit unit" : "Add unit"}
            leftIcon="x"
            onLeftPress={() => {
              setShowNew(false);
              setEditing(null);
            }}
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            <Field
              label="Unit name"
              value={name}
              onChangeText={setName}
              placeholder="Skyline 1201"
              autoCapitalize="words"
            />
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  color: c.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Type
              </Text>
              <SegmentedControl
                options={[
                  { value: "studio", label: "Studio" },
                  { value: "one_bedroom", label: "1 Bedroom" },
                ]}
                value={type}
                onChange={(v) => {
                  setType(v);
                  setRate(
                    String(
                      v === "studio"
                        ? settings.studioRate
                        : settings.oneBedroomRate,
                    ),
                  );
                }}
              />
            </View>
            <Field
              label="Nightly rate"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />
            <Field
              label="Cleaning fee"
              value={cleaning}
              onChangeText={setCleaning}
              keyboardType="numeric"
            />
            <Button
              label={editing ? "Save changes" : "Add unit"}
              onPress={submit}
              fullWidth
            />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
