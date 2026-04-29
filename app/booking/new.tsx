import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateInput } from "@/components/DateInput";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import type { Channel } from "@/types";
import { addDays, diffDays, parseISODate, todayISO, toISODate } from "@/utils/date";
import { formatMoney, bookingsForUnit } from "@/utils/finance";
import { rangesOverlap } from "@/utils/date";

export default function NewBookingScreen() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ unitId?: string; date?: string }>();
  const { units, bookings, addBooking, settings } = useRental();

  const initialUnitId = params.unitId ?? units[0]?.id ?? "";
  const initialDate = params.date ?? todayISO();

  const [unitId, setUnitId] = useState(initialUnitId);
  const [guestName, setGuestName] = useState("");
  const [channel, setChannel] = useState<Channel>("direct");
  const [checkIn, setCheckIn] = useState(initialDate);
  const [checkOut, setCheckOut] = useState(
    toISODate(addDays(parseISODate(initialDate), 2)),
  );
  const [guestCount, setGuestCount] = useState("2");

  const selectedUnit = units.find((u) => u.id === unitId);
  const [nightlyRate, setNightlyRate] = useState(
    String(selectedUnit?.nightlyRate ?? settings.studioRate),
  );
  const [cleaningFee, setCleaningFee] = useState(
    String(selectedUnit?.cleaningFee ?? settings.cleaningFee),
  );
  const [extraFees, setExtraFees] = useState("0");
  const [notes, setNotes] = useState("");

  const nights = Math.max(0, diffDays(checkIn, checkOut));
  const total = useMemo(
    () =>
      nights * (Number(nightlyRate) || 0) +
      (Number(cleaningFee) || 0) +
      (Number(extraFees) || 0),
    [nights, nightlyRate, cleaningFee, extraFees],
  );

  const submit = () => {
    if (!unitId) {
      Alert.alert("Pick a unit", "Please select which unit this booking is for.");
      return;
    }
    if (!guestName.trim()) {
      Alert.alert("Guest name required");
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      Alert.alert(
        "Invalid dates",
        "Check-out must be after check-in. Use YYYY-MM-DD format.",
      );
      return;
    }
    // overlap check
    const conflict = bookingsForUnit(bookings, unitId).find((b) =>
      rangesOverlap(b.checkIn, b.checkOut, checkIn, checkOut),
    );
    if (conflict) {
      Alert.alert(
        "Overlap detected",
        `This unit is already booked from ${conflict.checkIn} to ${conflict.checkOut} (${conflict.guestName}).`,
      );
      return;
    }

    addBooking({
      unitId,
      guestName: guestName.trim(),
      channel,
      checkIn,
      checkOut,
      nightlyRate: Number(nightlyRate) || 0,
      cleaningFee: Number(cleaningFee) || 0,
      extraFees: Number(extraFees) || 0,
      guestCount: Number(guestCount) || 1,
      notes: notes.trim() || undefined,
      status: "confirmed",
    });

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="New booking"
        leftIcon="x"
        onLeftPress={() => router.back()}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <Picker
          label="Unit"
          value={unitId}
          options={units.map((u) => ({ value: u.id, label: u.name }))}
          onChange={(v) => {
            setUnitId(v);
            const u = units.find((x) => x.id === v);
            if (u) {
              setNightlyRate(String(u.nightlyRate));
              setCleaningFee(String(u.cleaningFee));
            }
          }}
        />

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
          placeholder="Maria Santos"
          value={guestName}
          onChangeText={setGuestName}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <DateInput label="Check-in" value={checkIn} onChange={setCheckIn} />
          <View style={{ width: 12 }} />
          <DateInput label="Check-out" value={checkOut} onChange={setCheckOut} />
        </View>

        <View style={styles.row}>
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

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Extra fees"
              value={extraFees}
              onChangeText={setExtraFees}
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label="Guests"
              value={guestCount}
              onChangeText={setGuestCount}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Field
          label="Notes"
          placeholder="Special requests, ID type, etc."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <Card style={{ marginTop: 4, padding: 14 }}>
          <View style={styles.totalRow}>
            <View>
              <Text
                style={{
                  color: c.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Total · {nights} night{nights === 1 ? "" : "s"}
              </Text>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 26,
                  marginTop: 4,
                }}
              >
                {formatMoney(total, settings.currency)}
              </Text>
            </View>
            <Button label="Save booking" onPress={submit} />
          </View>
        </Card>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
