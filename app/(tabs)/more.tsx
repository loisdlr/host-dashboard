import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useRental } from "@/contexts/RentalContext";
import { formatMoney } from "@/utils/finance";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  route: any;
  accent?: string;
}

export default function MoreScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cleaners, jobs, bills, units, settings } = useRental();
  const install = useInstallPrompt();

  const unpaid = jobs.filter((j) => !j.paid).reduce((s, j) => s + j.amount, 0);
  const billsCount = bills.length;

  const items: MenuItem[] = [
    {
      icon: "users",
      label: "Cleaners",
      description: `${cleaners.length} cleaners · ${formatMoney(unpaid, settings.currency)} unpaid`,
      route: "/cleaners",
    },
    {
      icon: "bell",
      label: "Bills & dues",
      description: `${billsCount} recurring bills`,
      route: "/dues",
    },
    {
      icon: "file-text",
      label: "Generate quotation",
      description: "Studio & 1-bedroom rates",
      route: "/quotation",
    },
    {
      icon: "home",
      label: "Manage units",
      description: `${units.length} units`,
      route: "/units",
    },
    {
      icon: "refresh-cw",
      label: "Calendar sync",
      description: "Airbnb · Booking.com · Agoda · Google",
      route: "/sync",
    },
    {
      icon: "sliders",
      label: "Settings",
      description: `${settings.investorSharePct}% / ${settings.operatorSharePct}% split`,
      route: "/settings",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="More" />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 110,
          gap: 10,
        }}
      >
        {install.status !== "unsupported" && (
          <Card
            style={{
              borderWidth: 0,
              backgroundColor: c.primary,
              padding: 16,
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderRadius: c.radius - 4,
                  },
                ]}
              >
                <Feather name="download" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                  }}
                >
                  {install.status === "installed"
                    ? "App installed"
                    : install.status === "ios-instructions"
                    ? "Add to Home Screen"
                    : install.status === "manual"
                    ? "Install Cozy Manhattan"
                    : "Install Cozy Manhattan"}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {install.status === "installed"
                    ? "Open from your home screen anytime."
                    : install.status === "ios-instructions"
                    ? "Tap Share, then Add to Home Screen."
                    : install.status === "manual"
                    ? "Open in your browser, then tap the install icon in the address bar."
                    : "Run like a native app — works offline too."}
                </Text>
              </View>
              {install.status === "available" && (
                <Pressable
                  onPress={install.promptInstall}
                  style={({ pressed }) => ({
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: c.radius - 4,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: c.primary,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                    }}
                  >
                    Install
                  </Text>
                </Pressable>
              )}
              {install.status === "installing" && (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                  }}
                >
                  Opening…
                </Text>
              )}
              {install.status === "installed" && (
                <Feather name="check-circle" size={20} color="#FFFFFF" />
              )}
            </View>
          </Card>
        )}

        {items.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.route)}>
            {({ pressed }) => (
              <Card
                style={{
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: c.accent, borderRadius: c.radius - 4 },
                  ]}
                >
                  <Feather name={item.icon} size={18} color={c.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 15,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={c.mutedForeground} />
              </Card>
            )}
          </Pressable>
        ))}

        <Text
          style={{
            color: c.mutedForeground,
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Cozy Manhattan · v1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
