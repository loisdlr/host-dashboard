import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Channel } from "@/types";

export const channelLabel: Record<Channel, string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  booking: "Booking.com",
  agoda: "Agoda",
};

export function useChannelColor() {
  const c = useColors();
  return (channel: Channel): string => {
    switch (channel) {
      case "airbnb":
        return c.channelAirbnb;
      case "booking":
        return c.channelBooking;
      case "agoda":
        return c.channelAgoda;
      default:
        return c.channelDirect;
    }
  };
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const c = useColors();
  const color = useChannelColor()(channel);
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "1A",
          borderColor: color + "55",
          borderRadius: c.radius - 6,
        },
      ]}
    >
      <View
        style={[styles.dot, { backgroundColor: color }]}
      />
      <Text
        style={{
          color,
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
        }}
      >
        {channelLabel[channel]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
