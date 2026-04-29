import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
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
import { ChannelBadge, channelLabel, useChannelColor } from "@/components/ChannelBadge";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import type { Channel } from "@/types";

export default function SyncScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, updateUnit, bookings, settings } = useRental();
  const channelColor = useChannelColor();

  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [showAdd, setShowAdd] = useState(false);
  const [channel, setChannel] = useState<Channel>("airbnb");
  const [icalUrl, setIcalUrl] = useState("");

  const unit = units.find((u) => u.id === unitId);

  const exportUrl =
    unit?.icalExportUrl ??
    `webcal://rental.local/units/${unitId}/calendar.ics`;

  const addImport = () => {
    if (!unit || !icalUrl.trim().startsWith("http")) {
      Alert.alert("Enter a valid iCal URL");
      return;
    }
    updateUnit(unit.id, {
      icalImportUrls: [
        ...unit.icalImportUrls.filter((x) => x.channel !== channel),
        { channel, url: icalUrl.trim() },
      ],
    });
    setIcalUrl("");
    setShowAdd(false);
  };

  const removeImport = (ch: Channel) => {
    if (!unit) return;
    updateUnit(unit.id, {
      icalImportUrls: unit.icalImportUrls.filter((x) => x.channel !== ch),
    });
  };

  const copyExport = async () => {
    await Clipboard.setStringAsync(exportUrl);
    Alert.alert("Copied", "Paste this iCal URL into Airbnb, Booking.com, or Agoda to sync.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Calendar sync"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 14,
        }}
      >
        <Card>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 16,
            }}
          >
            How sync works
          </Text>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              marginTop: 6,
              lineHeight: 19,
            }}
          >
            Connect each unit to Airbnb, Booking.com, Agoda, and Google Calendar
            using their iCal links. Paste their import URL here and we keep your
            calendar in sync. Share your unit's export URL with each platform so
            they see your bookings too.
          </Text>
        </Card>

        <Picker
          label="Unit"
          value={unitId}
          options={units.map((u) => ({ value: u.id, label: u.name }))}
          onChange={setUnitId}
        />

        {unit ? (
          <>
            <Card>
              <View style={styles.rowBetween}>
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
                    Export URL
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_500Medium",
                      fontSize: 12,
                      marginTop: 6,
                    }}
                    numberOfLines={1}
                  >
                    {exportUrl}
                  </Text>
                </View>
                <Pressable
                  onPress={copyExport}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    {
                      backgroundColor: c.primary,
                      borderRadius: c.radius - 4,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Feather name="copy" size={14} color={c.primaryForeground} />
                </Pressable>
              </View>
            </Card>

            <View style={[styles.rowBetween, { marginTop: 4 }]}>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                }}
              >
                Imports
              </Text>
              <Pressable onPress={() => setShowAdd(true)} hitSlop={10}>
                <Text
                  style={{
                    color: c.primary,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  Add
                </Text>
              </Pressable>
            </View>

            {unit.icalImportUrls.length === 0 ? (
              <Card>
                <View style={{ alignItems: "center", paddingVertical: 18 }}>
                  <Feather
                    name="link"
                    size={20}
                    color={c.mutedForeground}
                  />
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      marginTop: 10,
                    }}
                  >
                    No calendars connected
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    Add an iCal URL from Airbnb, Booking.com, Agoda or Google.
                  </Text>
                </View>
              </Card>
            ) : (
              unit.icalImportUrls.map((imp) => (
                <Card key={imp.channel}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <ChannelBadge channel={imp.channel} />
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          marginTop: 8,
                        }}
                        numberOfLines={1}
                      >
                        {imp.url}
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={10}
                      onPress={() => removeImport(imp.channel)}
                    >
                      <Feather
                        name="trash-2"
                        size={16}
                        color={c.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader
            title="Connect calendar"
            leftIcon="x"
            onLeftPress={() => setShowAdd(false)}
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            <Picker
              label="Channel"
              value={channel}
              options={[
                { value: "airbnb", label: channelLabel.airbnb, color: c.channelAirbnb },
                {
                  value: "booking",
                  label: channelLabel.booking,
                  color: c.channelBooking,
                },
                {
                  value: "agoda",
                  label: channelLabel.agoda,
                  color: c.channelAgoda,
                },
                {
                  value: "direct",
                  label: "Google Calendar",
                  color: c.channelDirect,
                },
              ]}
              onChange={(v) => setChannel(v as Channel)}
            />
            <Field
              label="iCal URL"
              value={icalUrl}
              onChangeText={setIcalUrl}
              placeholder="https://www.airbnb.com/calendar/ical/..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button label="Connect" onPress={addImport} fullWidth />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copyBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});
