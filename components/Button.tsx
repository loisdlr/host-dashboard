import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  style,
  fullWidth,
  size = "md",
}: ButtonProps) {
  const c = useColors();

  const palette = (() => {
    switch (variant) {
      case "secondary":
        return {
          bg: c.secondary,
          fg: c.secondaryForeground,
          border: c.border,
        };
      case "ghost":
        return { bg: "transparent", fg: c.foreground, border: "transparent" };
      case "destructive":
        return {
          bg: c.destructive,
          fg: c.destructiveForeground,
          border: c.destructive,
        };
      default:
        return {
          bg: c.primary,
          fg: c.primaryForeground,
          border: c.primary,
        };
    }
  })();

  const padding =
    size === "sm"
      ? { paddingVertical: 8, paddingHorizontal: 14 }
      : size === "lg"
        ? { paddingVertical: 16, paddingHorizontal: 22 }
        : { paddingVertical: 13, paddingHorizontal: 18 };

  const textSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        padding,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: c.radius,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text
            style={{
              color: palette.fg,
              fontFamily: "Inter_600SemiBold",
              fontSize: textSize,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
