import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChannelBadge, channelLabel } from "@/components/ChannelBadge";
import { DateInput } from "@/components/DateInput";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import type { Channel } from "@/types";
import { diffDays, formatLong, rangesOverlap } from "@/utils/date";
import { bookingTotal, formatMoney } from "@/utils/finance";

export default function BookingDetail() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    bookings,
    units,
    settings,
    updateBooking,
    cancelBooking,
    deleteBooking,
  } = useRental();

  const booking = bookings.find((b) => b.id === id);
  const [editing, setEditing] = useState(false);

  const [guestName, setGuestName] = useState(booking?.guestName ?? "");
  const [channel, setChannel] = useState<Channel>(booking?.channel ?? "direct");
  const [checkIn, setCheckIn] = useState(booking?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(booking?.checkOut ?? "");
  const [nightlyRate, setNightlyRate] = useState(
    String(booking?.nightlyRate ?? 0),
  );
  const [cleaningFee, setCleaningFee] = useState(
    String(booking?.cleaningFee ?? 0),
  );
  const [extraFees, setExtraFees] = useState(String(booking?.extraFees ?? 0));
  const [notes, setNotes] = useState(booking?.notes ?? "");

  const unit = useMemo(
    () => units.find((u) => u.id === booking?.unitId),
    [booking?.unitId, units],
  );

  if (!booking) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader
          title="Booking"
          leftIcon="x"
          onLeftPress={() => router.back()}
        />
        <View style={{ padding: 24 }}>
          <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium" }}>
            This booking no longer exists.
          </Text>
        </View>
      </View>
    );
  }

  const nights = Math.max(0, diffDays(checkIn, checkOut));
  const previewTotal =
    nights * (Number(nightlyRate) || 0) +
    (Number(cleaningFee) || 0) +
    (Number(extraFees) || 0);

  const save = () => {
    if (!guestName.trim()) {
      Alert.alert("Guest name required");
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      Alert.alert("Invalid dates");
      return;
    }
    const conflict = bookings.find(
      (b) =>
        b.id !== booking.id &&
        b.unitId === booking.unitId &&
        b.status !== "cancelled" &&
        rangesOverlap(b.checkIn, b.checkOut, checkIn, checkOut),
    );
    if (conflict) {
      Alert.alert("Overlap", `Conflicts with ${conflict.guestName}.`);
      return;
    }
    updateBooking(booking.id, {
      guestName: guestName.trim(),
      channel,
      checkIn,
      checkOut,
      nightlyRate: Number(nightlyRate) || 0,
      cleaningFee: Number(cleaningFee) || 0,
      extraFees: Number(extraFees) || 0,
      notes: notes.trim() || undefined,
    });
    setEditing(false);
  };

  const onCancel = () => {
    Alert.alert("Cancel booking", `Cancel reservation for ${booking.guestName}?`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: () => {
          cancelBooking(booking.id);
          router.back();
        },
      },
    ]);
  };

  const onDelete = () => {
  const message = "Delete this booking? This cannot be undone.";
  
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      deleteBooking(id);
      router.back();
    }
  } else {
    Alert.alert("Delete booking", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteBooking(id);
          router.back();
        },
      },
    ]);
  }
};

  if (editing) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader
          title="Edit booking"
          leftIcon="x"
          onLeftPress={() => setEditing(false)}
        />
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={20}
        >
          <Picker
            label="Channel"
            value={channel}
            options={[
              { value: "direct", label: "Direct", color: c.channelDirect },
              { value: "airbnb", label: "Airbnb", color: c.channelAirbnb },
              { value: "booking", label: "Booking.com", color: c.channelBooking },
              { value: "agoda", label: "Agoda", color: c.channelAgoda },
            ]}
            onChange={(v) => setChannel(v as Channel)}
          />
          <Field
            label="Guest name"
            value={guestName}
            onChangeText={setGuestName}
          />
          <View style={{ flexDirection: "row" }}>
            <DateInput label="Check-in" value={checkIn} onChange={setCheckIn} />
            <View style={{ width: 12 }} />
            <DateInput
              label="Check-out"
              value={checkOut}
              onChange={setCheckOut}
            />
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Nightly rate"
                value={nightlyRate}
                onChangeText={setNightlyRate}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field
                label="Cleaning fee"
                value={cleaningFee}
                onChangeText={setCleaningFee}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Field
            label="Extra fees"
            value={extraFees}
            onChangeText={setExtraFees}
            keyboardType="numeric"
          />
          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Card style={{ padding: 14 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                }}
              >
                {formatMoney(previewTotal, settings.currency)}
              </Text>
              <Button label="Save changes" onPress={save} />
            </View>
          </Card>
        </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Booking"
        leftIcon="x"
        onLeftPress={() => router.back()}
        rightIcon="edit-2"
        onRightPress={() => setEditing(true)}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Card>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {unit?.name ?? "Unit"} ·{" "}
            {unit?.type === "studio" ? "Studio" : "1 BR"}
          </Text>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 26,
              marginTop: 4,
            }}
          >
            {booking.guestName}
          </Text>
          <View style={{ marginTop: 10 }}>
            <ChannelBadge channel={booking.channel} />
          </View>
          {booking.status === "cancelled" ? (
            <View
              style={[
                styles.cancelTag,
                {
                  backgroundColor: c.destructive + "1A",
                  borderRadius: c.radius - 4,
                },
              ]}
            >
              <Feather name="x-circle" size={14} color={c.destructive} />
              <Text
                style={{
                  color: c.destructive,
                  fontFamily: "Inter_700Bold",
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                Cancelled
              </Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.mutedForeground }]}>
                Check-in
              </Text>
              <Text style={[styles.dateValue, { color: c.foreground }]}>
                {formatLong(booking.checkIn)}
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={c.mutedForeground} />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.label, { color: c.mutedForeground }]}>
                Check-out
              </Text>
              <Text style={[styles.dateValue, { color: c.foreground }]}>
                {formatLong(booking.checkOut)}
              </Text>
            </View>
          </View>
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: c.border,
              marginTop: 14,
              paddingTop: 14,
            }}
          >
            <DetailRow
              label={`${diffDays(booking.checkIn, booking.checkOut)} nights × ${formatMoney(booking.nightlyRate, settings.currency)}`}
              value={formatMoney(
                diffDays(booking.checkIn, booking.checkOut) * booking.nightlyRate,
                settings.currency,
              )}
            />
            <DetailRow
              label="Cleaning fee"
              value={formatMoney(booking.cleaningFee, settings.currency)}
            />
            {booking.extraFees > 0 ? (
              <DetailRow
                label="Extra fees"
                value={formatMoney(booking.extraFees, settings.currency)}
              />
            ) : null}
            <View
              style={{
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: c.border,
                marginTop: 10,
                paddingTop: 10,
              }}
            >
              <DetailRow
                label="Total"
                value={formatMoney(bookingTotal(booking), settings.currency)}
                bold
              />
            </View>
          </View>
        </Card>

        {booking.notes ? (
          <Card>
            <Text style={[styles.label, { color: c.mutedForeground }]}>
              Notes
            </Text>
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              {booking.notes}
            </Text>
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.label, { color: c.mutedForeground }]}>
            Channel · {channelLabel[booking.channel]}
          </Text>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            Created {new Date(booking.createdAt).toLocaleDateString()} ·{" "}
            {booking.guestCount} guest
            {booking.guestCount === 1 ? "" : "s"}
          </Text>
        </Card>

        <View style={{ gap: 10 }}>
          {booking.status !== "cancelled" ? (
            <Button
              label="Cancel reservation"
              variant="secondary"
              onPress={onCancel}
              icon={<Feather name="x" size={16} color={c.foreground} />}
            />
          ) : null}
          <Button
            label="Delete booking"
            variant="destructive"
            onPress={onDelete}
            icon={
              <Feather name="trash-2" size={16} color={c.destructiveForeground} />
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 4,
      }}
    >
      <Text
        style={{
          color: bold ? c.foreground : c.mutedForeground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_500Medium",
          fontSize: bold ? 15 : 13,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: c.foreground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold",
          fontSize: bold ? 15 : 13,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginTop: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
});
