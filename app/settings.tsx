import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";

const PRESETS = [50, 60, 70, 80];

export default function SettingsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, reset } = useRental();

  const [investorPct, setInvestorPct] = useState(
    String(settings.investorSharePct),
  );
  const [currency, setCurrency] = useState(settings.currency);

  const apply = () => {
    const inv = Math.max(0, Math.min(100, Number(investorPct) || 0));
    updateSettings({
      investorSharePct: inv,
      currency: currency || "₱",
    });
    Alert.alert("Saved", "Settings updated.");
  };

  const operatorPct = 100 - (Number(investorPct) || 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Settings"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <Card>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 16,
            }}
          >
            Profit split
          </Text>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Net income (after expenses) is split between investor and operator.
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            {PRESETS.map((p) => {
              const active = Number(investorPct) === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setInvestorPct(String(p))}
                  style={({ pressed }) => [
                    styles.preset,
                    {
                      backgroundColor: active ? c.primary : c.muted,
                      borderColor: active ? c.primary : c.border,
                      borderRadius: c.radius - 4,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? c.primaryForeground : c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                    }}
                  >
                    {p}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Investor %"
                value={investorPct}
                onChangeText={setInvestorPct}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field
                label="Operator %"
                value={String(operatorPct)}
                editable={false}
              />
            </View>
          </View>

          <View
            style={[
              styles.bar,
              { backgroundColor: c.muted, borderRadius: 999 },
            ]}
          >
            <View
              style={{
                width: `${Math.max(0, Math.min(100, Number(investorPct) || 0))}%`,
                backgroundColor: c.primary,
              }}
            />
            <View
              style={{
                flex: 1,
                backgroundColor: c.warning,
              }}
            />
          </View>
        </Card>

        <View style={{ height: 14 }} />

        <Card>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 16,
            }}
          >
            Currency
          </Text>
          <Field
            label="Currency symbol"
            value={currency}
            onChangeText={setCurrency}
            placeholder="₱, $, €..."
          />
        </Card>

        <View style={{ height: 14 }} />

        <Button label="Save settings" onPress={apply} fullWidth />

        <View style={{ height: 24 }} />

        <Card>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 16,
            }}
          >
            Reset
          </Text>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 4,
              marginBottom: 14,
            }}
          >
            Restore the demo data with 6 default units, sample bookings, bills, and cleaners.
          </Text>
          <Button
            label="Reset to demo data"
            variant="secondary"
            icon={<Feather name="refresh-cw" size={16} color={c.foreground} />}
            onPress={() =>
              Alert.alert(
                "Reset all data",
                "This will replace all bookings, expenses, bills and cleaners. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                      reset();
                      router.back();
                    },
                  },
                ],
              )
            }
          />
        </Card>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  preset: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: "row",
    height: 12,
    overflow: "hidden",
    marginTop: 8,
  },
});
