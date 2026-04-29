import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateInput } from "@/components/DateInput";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import {
  addDays,
  formatLong,
  parseISODate,
  todayISO,
  toISODate,
} from "@/utils/date";
import { formatMoney } from "@/utils/finance";
import type { Pricing, UnitType } from "@/types";

interface NightBreakdown {
  date: string;
  dow: string;
  tier: "weekday" | "weekend" | "holiday";
  base: number;
  extra: number;
  pet: number;
  total: number;
}

function computeQuote(opts: {
  unitType: UnitType;
  checkIn: string;
  checkOut: string;
  pax: number;
  pets: number;
  pricing: Pricing;
  holidayMode: boolean;
}): { nights: NightBreakdown[]; subtotal: number } {
  const nights: NightBreakdown[] = [];
  if (!opts.checkIn || !opts.checkOut) return { nights, subtotal: 0 };
  const start = parseISODate(opts.checkIn);
  const end = parseISODate(opts.checkOut);
  if (end <= start) return { nights, subtotal: 0 };
  const unitPricing =
    opts.unitType === "studio" ? opts.pricing.studio : opts.pricing.oneBedroom;
  let cur = new Date(start);
  let subtotal = 0;
  while (cur < end) {
    const dow = cur.getDay();
    const tier: NightBreakdown["tier"] = opts.holidayMode
      ? "holiday"
      : dow === 0 || dow === 6
        ? "weekend"
        : "weekday";
    const tierRates = unitPricing[tier];
    const base = opts.pax <= 2 ? tierRates.base2 : tierRates.base4;
    const extraPax = Math.max(0, opts.pax - 4);
    const extra = extraPax * unitPricing.extraPaxFee;
    const pet = opts.pets > 0 ? opts.pricing.petFeePerNight : 0;
    const total = base + extra + pet;
    nights.push({
      date: toISODate(cur),
      dow: cur.toLocaleDateString(undefined, { weekday: "short" }),
      tier,
      base,
      extra,
      pet,
      total,
    });
    subtotal += total;
    cur = addDays(cur, 1);
  }
  return { nights, subtotal };
}

const TIER_LABEL: Record<NightBreakdown["tier"], string> = {
  weekday: "Weekday",
  weekend: "Weekend",
  holiday: "Holiday",
};

export default function QuotationScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useRental();

  const [unitType, setUnitType] = useState<UnitType>("studio");
  const [guestName, setGuestName] = useState("");
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(
    toISODate(addDays(parseISODate(todayISO()), 3)),
  );
  const [pax, setPax] = useState("2");
  const [pets, setPets] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [lateFee, setLateFee] = useState("0");
  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [holidayMode, setHolidayMode] = useState(false);

  const paxNum = Math.max(1, Number(pax) || 0);
  const petsNum = Math.max(0, Number(pets) || 0);
  const discountPct = Math.max(0, Math.min(100, Number(discount) || 0));
  const lateFeeNum = Math.max(0, Number(lateFee) || 0);
  const depositNum = Math.max(0, Number(securityDeposit) || 0);

  const { nights, subtotal } = useMemo(
    () =>
      computeQuote({
        unitType,
        checkIn,
        checkOut,
        pax: paxNum,
        pets: petsNum,
        pricing: settings.pricing,
        holidayMode,
      }),
    [
      unitType,
      checkIn,
      checkOut,
      paxNum,
      petsNum,
      settings.pricing,
      holidayMode,
    ],
  );

  const totalNights = nights.length;
  const discountAmount = (subtotal * discountPct) / 100;
  const total = Math.max(
    0,
    subtotal - discountAmount + lateFeeNum + depositNum,
  );
  const dueOnArrival = depositNum;

  const cur = settings.currency;

  const quoteText = useMemo(() => {
    const lines: (string | null)[] = [
      `Cozy Manhattan Quotation${guestName ? ` — ${guestName}` : ""}`,
      `Unit type: ${unitType === "studio" ? "Studio" : "1 Bedroom"}`,
      `Check-in: ${formatLong(checkIn)}`,
      `Check-out: ${formatLong(checkOut)}`,
      `Pax: ${paxNum}${petsNum > 0 ? `   Pets: ${petsNum}` : ""}`,
      ``,
      `${totalNights} night${totalNights === 1 ? "" : "s"} (subtotal): ${formatMoney(subtotal, cur)}`,
      discountAmount > 0
        ? `Discount (${discountPct}%): -${formatMoney(discountAmount, cur)}`
        : null,
      lateFeeNum > 0
        ? `Late check-in fee: ${formatMoney(lateFeeNum, cur)}`
        : null,
      depositNum > 0
        ? `Security deposit: ${formatMoney(depositNum, cur)}`
        : null,
      `TOTAL: ${formatMoney(total, cur)}`,
    ];
    return lines.filter(Boolean).join("\n");
  }, [
    guestName,
    unitType,
    checkIn,
    checkOut,
    paxNum,
    petsNum,
    totalNights,
    subtotal,
    discountPct,
    discountAmount,
    lateFeeNum,
    depositNum,
    total,
    cur,
  ]);

  const onShare = async () => {
    try {
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(quoteText);
        Alert.alert("Copied", "Quotation copied to clipboard.");
      } else {
        await Share.share({ message: quoteText });
      }
    } catch {
      // ignore
    }
  };

  const onCopy = async () => {
    await Clipboard.setStringAsync(quoteText);
    Alert.alert("Copied", "Quotation copied to clipboard.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Quotation"
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
        <SegmentedControl
          options={[
            { value: "studio", label: "Studio" },
            { value: "one_bedroom", label: "1 Bedroom" },
          ]}
          value={unitType}
          onChange={(v) => setUnitType(v)}
        />

        <View style={{ height: 12 }} />

        <Field
          label="Guest name (optional)"
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
              label="Number of pax"
              value={pax}
              onChangeText={setPax}
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label="Number of pets"
              value={pets}
              onChangeText={setPets}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Card
          style={{
            marginTop: 4,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              Apply holiday rates
            </Text>
            <Text
              style={{
                color: c.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Use the higher holiday rate for every night.
            </Text>
          </View>
          <Switch
            value={holidayMode}
            onValueChange={setHolidayMode}
            trackColor={{ true: c.primary, false: c.muted }}
            thumbColor="#fff"
          />
        </Card>

        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Discount (%)"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label="Late check-in fee"
              value={lateFee}
              onChangeText={setLateFee}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Field
          label="Security deposit"
          value={securityDeposit}
          onChangeText={setSecurityDeposit}
          keyboardType="numeric"
        />

        {/* Per-night breakdown */}
        {totalNights > 0 ? (
          <Card style={{ marginTop: 4, padding: 0 }}>
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.border,
              }}
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
                Per-night breakdown
              </Text>
            </View>
            {nights.map((n, idx) => (
              <View
                key={n.date}
                style={[
                  styles.nightRow,
                  {
                    borderTopColor: c.border,
                    borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                    }}
                  >
                    {n.dow} · {n.date.slice(5)}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {TIER_LABEL[n.tier]} · base {formatMoney(n.base, cur)}
                    {n.extra > 0 ? ` · +pax ${formatMoney(n.extra, cur)}` : ""}
                    {n.pet > 0 ? ` · +pet ${formatMoney(n.pet, cur)}` : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    color: c.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                  }}
                >
                  {formatMoney(n.total, cur)}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Summary */}
        <Card style={{ marginTop: 4 }}>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_500Medium",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Quotation summary
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            <SummaryRow label={`Total nights`} value={String(totalNights)} />
            <SummaryRow label="Subtotal" value={formatMoney(subtotal, cur)} />
            {discountAmount > 0 ? (
              <SummaryRow
                label={`Discount (${discountPct}%)`}
                value={`-${formatMoney(discountAmount, cur)}`}
                color={c.success}
              />
            ) : null}
            {lateFeeNum > 0 ? (
              <SummaryRow
                label="Late check-in fee"
                value={formatMoney(lateFeeNum, cur)}
              />
            ) : null}
            {depositNum > 0 ? (
              <SummaryRow
                label="Security deposit"
                value={formatMoney(depositNum, cur)}
              />
            ) : null}
          </View>
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: c.border,
              marginTop: 12,
              paddingTop: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 16,
              }}
            >
              TOTAL AMOUNT
            </Text>
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 26,
              }}
            >
              {formatMoney(total, cur)}
            </Text>
          </View>
          {dueOnArrival > 0 ? (
            <Text
              style={{
                color: c.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                marginTop: 6,
                textAlign: "right",
              }}
            >
              Includes {formatMoney(dueOnArrival, cur)} refundable security
              deposit
            </Text>
          ) : null}
        </Card>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Copy"
              variant="secondary"
              onPress={onCopy}
              icon={<Feather name="copy" size={16} color={c.foreground} />}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Share"
              onPress={onShare}
              icon={
                <Feather name="share-2" size={16} color={c.primaryForeground} />
              }
              fullWidth
            />
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.summaryRow}>
      <Text
        style={{
          color: c.mutedForeground,
          fontFamily: "Inter_500Medium",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: color ?? c.foreground,
          fontFamily: "Inter_700Bold",
          fontSize: 14,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
});
