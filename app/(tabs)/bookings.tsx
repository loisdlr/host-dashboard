import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { ChannelBadge } from "@/components/ChannelBadge";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { diffDays, formatLong, todayISO } from "@/utils/date";
import { bookingTotal, formatMoney } from "@/utils/finance";

type Filter = "upcoming" | "past" | "cancelled";

export default function BookingsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, units, settings } = useRental();
  const [filter, setFilter] = useState<Filter>("upcoming");

  const today = todayISO();
  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";

  const list = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (filter === "cancelled") return b.status === "cancelled";
      if (filter === "past")
        return b.status !== "cancelled" && b.checkOut <= today;
      return b.status !== "cancelled" && b.checkOut > today;
    });
    return filtered.sort((a, b) => {
      if (filter === "past") return b.checkOut.localeCompare(a.checkOut);
      return a.checkIn.localeCompare(b.checkIn);
    });
  }, [bookings, filter, today]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Bookings"
        subtitle={`${list.length} ${filter}`}
        rightIcon="plus"
        onRightPress={() => router.push("/booking/new")}
      />
      <View style={styles.controls}>
        <SegmentedControl
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 110,
          gap: 10,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No bookings"
            description={
              filter === "upcoming"
                ? "Tap the + button to add a new booking."
                : filter === "past"
                  ? "Past bookings will appear here."
                  : "Cancelled bookings will appear here."
            }
          />
        }
        renderItem={({ item }) => {
          const nights = Math.max(0, diffDays(item.checkIn, item.checkOut));
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/booking/[id]",
                  params: { id: item.id },
                })
              }
            >
              {({ pressed }) => (
                <Card style={{ opacity: pressed ? 0.85 : 1 }}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_700Bold",
                          fontSize: 16,
                        }}
                      >
                        {item.guestName}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_500Medium",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {unitName(item.unitId)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_700Bold",
                          fontSize: 16,
                        }}
                      >
                        {formatMoney(bookingTotal(item), settings.currency)}
                      </Text>
                      <ChannelBadge channel={item.channel} />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.dateRow,
                      { borderTopColor: c.border, marginTop: 12, paddingTop: 12 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_500Medium",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Check-in
                      </Text>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {formatLong(item.checkIn)}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={16} color={c.mutedForeground} />
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_500Medium",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Check-out · {nights}N
                      </Text>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {formatLong(item.checkOut)}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
});
