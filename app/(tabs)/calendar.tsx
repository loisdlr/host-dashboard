import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChannelBadge, useChannelColor } from "@/components/ChannelBadge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import {
  addDays,
  buildDateRange,
  parseISODate,
  todayISO,
  toISODate,
} from "@/utils/date";
import { unitOccupancyOnDate } from "@/utils/finance";

const COL_WIDTH = 56;
const ROW_HEIGHT = 64;
const UNIT_COL = 116;

export default function CalendarScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings } = useRental();
  const channelColor = useChannelColor();

  const [span, setSpan] = useState<"14" | "30" | "60">("14");
  const [anchor, setAnchor] = useState<Date>(parseISODate(todayISO()));

  const days = parseInt(span, 10);
  const dates = useMemo(() => buildDateRange(anchor, days), [anchor, days]);

  const today = todayISO();

  const monthLabel = useMemo(() => {
    const first = parseISODate(dates[0]!);
    const last = parseISODate(dates[dates.length - 1]!);
    const sameMonth = first.getMonth() === last.getMonth();
    if (sameMonth) {
      return first.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    return `${first.toLocaleDateString(undefined, { month: "short" })} – ${last.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  }, [dates]);

  const handleCellPress = (unitId: string, date: string) => {
    const booking = unitOccupancyOnDate(bookings, unitId, date);
    if (booking) {
      router.push({ pathname: "/booking/[id]", params: { id: booking.id } });
    } else {
      router.push({
        pathname: "/booking/new",
        params: { unitId, date },
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Calendar"
        subtitle={monthLabel}
        rightIcon="plus"
        onRightPress={() => router.push("/booking/new")}
      />

      <View style={styles.controls}>
        <SegmentedControl
          options={[
            { value: "14", label: "2 weeks" },
            { value: "30", label: "Month" },
            { value: "60", label: "60 days" },
          ]}
          value={span}
          onChange={(v) => setSpan(v)}
        />
        <View style={styles.navRow}>
          <Pressable
            onPress={() => setAnchor((d) => addDays(d, -days))}
            style={({ pressed }) => [
              styles.navBtn,
              {
                backgroundColor: c.muted,
                borderRadius: c.radius - 4,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="chevron-left" size={18} color={c.foreground} />
          </Pressable>
          <Pressable
            onPress={() => setAnchor(parseISODate(todayISO()))}
            style={({ pressed }) => [
              styles.todayBtn,
              {
                backgroundColor: c.primary,
                borderRadius: c.radius - 4,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: c.primaryForeground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Today
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAnchor((d) => addDays(d, days))}
            style={({ pressed }) => [
              styles.navBtn,
              {
                backgroundColor: c.muted,
                borderRadius: c.radius - 4,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="chevron-right" size={18} color={c.foreground} />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{ flexDirection: "column" }}
        >
          <View>
            {/* Header row: dates */}
            <View style={[styles.row, { backgroundColor: c.background }]}>
              <View
                style={[
                  styles.unitHeader,
                  {
                    width: UNIT_COL,
                    borderRightColor: c.border,
                    borderBottomColor: c.border,
                    backgroundColor: c.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color: c.mutedForeground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Units
                </Text>
              </View>
              {dates.map((d) => {
                const date = parseISODate(d);
                const isToday = d === today;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <View
                    key={d}
                    style={[
                      styles.dateHeader,
                      {
                        width: COL_WIDTH,
                        borderRightColor: c.border,
                        borderBottomColor: c.border,
                        backgroundColor: isToday
                          ? c.primary + "12"
                          : isWeekend
                            ? c.muted
                            : c.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isToday ? c.primary : c.mutedForeground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 10,
                        textTransform: "uppercase",
                      }}
                    >
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </Text>
                    <Text
                      style={{
                        color: isToday ? c.primary : c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        marginTop: 2,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator>
              {units.map((unit, idx) => {
                // Build run-length blocks for this unit
                type Block = {
                  start: number;
                  length: number;
                  bookingId: string;
                  channel: import("@/types").Channel;
                  guestName: string;
                  startCap: boolean;
                  endCap: boolean;
                };
                const blocks: Block[] = [];
                let cursor = 0;
                while (cursor < dates.length) {
                  const date = dates[cursor]!;
                  const b = unitOccupancyOnDate(bookings, unit.id, date);
                  if (b) {
                    let length = 1;
                    while (
                      cursor + length < dates.length &&
                      unitOccupancyOnDate(bookings, unit.id, dates[cursor + length]!)?.id === b.id
                    ) {
                      length++;
                    }
                    blocks.push({
                      start: cursor,
                      length,
                      bookingId: b.id,
                      channel: b.channel,
                      guestName: b.guestName,
                      startCap: b.checkIn === date,
                      endCap:
                        b.checkOut ===
                        toISODate(addDays(parseISODate(dates[cursor + length - 1]!), 1)),
                    });
                    cursor += length;
                  } else {
                    cursor += 1;
                  }
                }

                return (
                  <View
                    key={unit.id}
                    style={[
                      styles.row,
                      idx > 0 && { borderTopWidth: 0 },
                    ]}
                  >
                    <View
                      style={[
                        styles.unitCell,
                        {
                          width: UNIT_COL,
                          height: ROW_HEIGHT,
                          borderRightColor: c.border,
                          borderBottomColor: c.border,
                          backgroundColor: c.background,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                        }}
                        numberOfLines={1}
                      >
                        {unit.name}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {unit.type === "studio" ? "Studio" : "1 BR"}
                      </Text>
                    </View>

                    {/* Empty cells background grid */}
                    <View style={{ flexDirection: "row", position: "relative" }}>
                      {dates.map((d) => {
                        const isToday = d === today;
                        const date = parseISODate(d);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <Pressable
                            key={d}
                            onPress={() => handleCellPress(unit.id, d)}
                            style={[
                              styles.cell,
                              {
                                width: COL_WIDTH,
                                height: ROW_HEIGHT,
                                borderRightColor: c.border,
                                borderBottomColor: c.border,
                                backgroundColor: isToday
                                  ? c.primary + "08"
                                  : isWeekend
                                    ? c.muted + "AA"
                                    : c.background,
                              },
                            ]}
                          />
                        );
                      })}

                      {/* Booking blocks overlay */}
                      {blocks.map((block) => {
                        const color = channelColor(block.channel);
                        return (
                          <Pressable
                            key={`${block.bookingId}-${block.start}`}
                            onPress={() =>
                              router.push({
                                pathname: "/booking/[id]",
                                params: { id: block.bookingId },
                              })
                            }
                            style={[
                              styles.block,
                              {
                                left:
                                  block.start * COL_WIDTH +
                                  (block.startCap ? COL_WIDTH / 2 : 0),
                                width:
                                  block.length * COL_WIDTH -
                                  (block.startCap ? COL_WIDTH / 2 : 0) -
                                  (block.endCap ? COL_WIDTH / 2 : 0),
                                top: 8,
                                height: ROW_HEIGHT - 16,
                                backgroundColor: color,
                                borderTopLeftRadius: block.startCap ? 999 : 0,
                                borderBottomLeftRadius: block.startCap ? 999 : 0,
                                borderTopRightRadius: block.endCap ? 999 : 0,
                                borderBottomRightRadius: block.endCap ? 999 : 0,
                              },
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                color: "#FFFFFF",
                                fontFamily: "Inter_600SemiBold",
                                fontSize: 12,
                                paddingHorizontal: 10,
                              }}
                            >
                              {block.guestName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <View style={{ height: insets.bottom + 110 }} />
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Channel legend */}
      <View
        style={[
          styles.legend,
          {
            backgroundColor: c.background,
            borderTopColor: c.border,
            paddingBottom: insets.bottom + 90,
          },
        ]}
      >
        <ChannelBadge channel="direct" />
        <ChannelBadge channel="airbnb" />
        <ChannelBadge channel="booking" />
        <ChannelBadge channel="agoda" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBtn: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  unitHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  dateHeader: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unitCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  cell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  block: {
    position: "absolute",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
