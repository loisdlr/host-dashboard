import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  leftIcon?: keyof typeof Feather.glyphMap;
  onLeftPress?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  leftIcon,
  onLeftPress,
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 18) : insets.top;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad + 6,
          backgroundColor: c.background,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={styles.row}>
        {leftIcon ? (
          <Pressable
            onPress={onLeftPress}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: c.muted,
                opacity: pressed ? 0.7 : 1,
                borderRadius: c.radius - 4,
              },
            ]}
          >
            <Feather name={leftIcon} size={18} color={c.foreground} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 17,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: c.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: c.primary,
                opacity: pressed ? 0.7 : 1,
                borderRadius: c.radius - 4,
              },
            ]}
          >
            <Feather name={rightIcon} size={18} color={c.primaryForeground} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
