import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { StatCard } from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import {
  formatLong,
  parseISODate,
  todayISO,
  toISODate,
} from "@/utils/date";
import {
  bookingTotal,
  formatMoney,
  splitForAll,
  splitForUnit,
} from "@/utils/finance";
import { buildIncomeStatementHtml, exportPdf } from "@/utils/pdf";
import type { Booking, Expense, Settings, Unit } from "@/types";

type Period = "month" | "ytd" | "all";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");

  const range = useMemo(() => {
    const now = parseISODate(todayISO());
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toISODate(start), end: toISODate(end) };
    }
    if (period === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: toISODate(start), end: toISODate(now) };
    }
    return undefined;
  }, [period]);

  const result = useMemo(() => {
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  const unitBreakdown = useMemo(() => {
    return units.map((u) => ({
      unit: u,
      split: splitForUnit(u.id, bookings, expenses, settings, range),
    }));
  }, [units, bookings, expenses, settings, range]);

  const recentExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") {
      list = list.filter((e) => e.unitId === unitId || e.unitId === "all");
    }
    if (range) {
      list = list.filter((e) => e.date >= range.start && e.date <= range.end);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [expenses, unitId, range]);

  const periodLabel =
    period === "month"
      ? "This month"
      : period === "ytd"
        ? "Year to date"
        : "All time";

  const onExportPdf = async () => {
    try {
      const targetUnits =
        unitId === "all" ? units : units.filter((u) => u.id === unitId);
      if (targetUnits.length === 0) {
        Alert.alert("No unit selected");
        return;
      }
      // For a single PDF, export per-unit. If "All units" is chosen, generate
      // a combined "Portfolio" statement listing every booking/expense.
      const html =
        unitId === "all"
          ? buildPortfolioPdf(units, bookings, expenses, settings, range, periodLabel)
          : buildSingleUnitPdf(targetUnits[0]!, bookings, expenses, settings, range, periodLabel);

      await exportPdf({
        html,
        filename: `${unitId === "all" ? "CozyManhattan-Portfolio" : (targetUnits[0]?.name ?? "Unit")}-Statement.pdf`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not export PDF.";
      Alert.alert("Export failed", msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Finance"
        subtitle={periodLabel}
        rightIcon="settings"
        onRightPress={() => router.push("/settings")}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 110,
          gap: 16,
        }}
      >
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v)}
        />

        {/* Unit picker scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <UnitChip
            label="All units"
            active={unitId === "all"}
            onPress={() => setUnitId("all")}
          />
          {units.map((u) => (
            <UnitChip
              key={u.id}
              label={u.name}
              active={unitId === u.id}
              onPress={() => setUnitId(u.id)}
            />
          ))}
        </ScrollView>

        {/* Export PDF */}
        <Button
          label={
            unitId === "all"
              ? "Export portfolio PDF"
              : `Export ${units.find((u) => u.id === unitId)?.name ?? "unit"} PDF`
          }
          variant="secondary"
          icon={<Feather name="file-text" size={16} color={c.foreground} />}
          onPress={onExportPdf}
          fullWidth
        />

        {/* Headline */}
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
            Net profit · {periodLabel}
          </Text>
          <Text
            style={{
              color: result.net >= 0 ? c.foreground : c.destructive,
              fontFamily: "Inter_700Bold",
              fontSize: 32,
              marginTop: 6,
            }}
          >
            {formatMoney(result.net, settings.currency)}
          </Text>
          <View
            style={[
              styles.divider,
              { borderColor: c.border, marginVertical: 14 },
            ]}
          />
          <View style={{ gap: 10 }}>
            <Row
              label="Gross income"
              value={formatMoney(result.gross, settings.currency)}
              valueColor={c.foreground}
            />
            <Row
              label="Expenses"
              value={`- ${formatMoney(result.expenses, settings.currency)}`}
              valueColor={c.destructive}
            />
          </View>
        </Card>

        {/* Investor split */}
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                }}
              >
                Profit distribution
              </Text>
              <Text
                style={{
                  color: c.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {settings.investorSharePct}% investor · {settings.operatorSharePct}% operator
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={() => router.push("/settings")}>
              <Feather name="sliders" size={18} color={c.primary} />
            </Pressable>
          </View>

          <View style={{ marginTop: 16 }}>
            <SplitBar
              investorPct={settings.investorSharePct}
              operatorPct={settings.operatorSharePct}
            />
          </View>

          <View style={[styles.splitRow, { marginTop: 18 }]}>
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
                Investor ({settings.investorSharePct}%)
              </Text>
              <Text
                style={{
                  color: c.primary,
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                  marginTop: 4,
                }}
              >
                {formatMoney(result.investorShare, settings.currency)}
              </Text>
            </View>
            <View style={[styles.divider, { borderColor: c.border, height: 40, borderRightWidth: StyleSheet.hairlineWidth }]} />
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
                Operator ({settings.operatorSharePct}%)
              </Text>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                  marginTop: 4,
                }}
              >
                {formatMoney(result.operatorShare, settings.currency)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Per-unit breakdown */}
        {unitId === "all" ? (
          <View>
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              By unit
            </Text>
            <View style={{ gap: 10 }}>
              {unitBreakdown.map(({ unit, split }) => {
                const max = Math.max(
                  1,
                  ...unitBreakdown.map((x) => Math.abs(x.split.net)),
                );
                const widthPct = Math.min(
                  100,
                  Math.round((Math.abs(split.net) / max) * 100),
                );
                return (
                  <Card key={unit.id} style={{ padding: 14 }}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: c.foreground,
                            fontFamily: "Inter_600SemiBold",
                            fontSize: 14,
                          }}
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
                          {formatMoney(split.gross, settings.currency)} gross ·{" "}
                          {formatMoney(split.expenses, settings.currency)} exp
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: split.net >= 0 ? c.foreground : c.destructive,
                          fontFamily: "Inter_700Bold",
                          fontSize: 15,
                        }}
                      >
                        {formatMoney(split.net, settings.currency)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: c.muted, borderRadius: 999 },
                      ]}
                    >
                      <View
                        style={{
                          width: `${widthPct}%`,
                          height: "100%",
                          backgroundColor:
                            split.net >= 0 ? c.primary : c.destructive,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Recent expenses */}
        <View>
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <Text
              style={{
                color: c.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 16,
              }}
            >
              Recent expenses
            </Text>
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              icon={<Feather name="plus" size={14} color={c.foreground} />}
              onPress={() => router.push("/expense/new")}
            />
          </View>
          <Card style={{ padding: 0 }}>
            {recentExpenses.length === 0 ? (
              <EmptyState
                icon="dollar-sign"
                title="No expenses yet"
                description="Track repairs, supplies, and bills here."
              />
            ) : (
              recentExpenses.map((e, idx) => (
                <View
                  key={e.id}
                  style={[
                    styles.expenseRow,
                    {
                      borderTopColor: c.border,
                      borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.expenseIcon,
                      { backgroundColor: c.accent, borderRadius: c.radius - 6 },
                    ]}
                  >
                    <Feather name="tag" size={14} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      {e.description || e.category}
                    </Text>
                    <Text
                      style={{
                        color: c.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {e.category} ·{" "}
                      {e.unitId === "all"
                        ? "All units"
                        : units.find((u) => u.id === e.unitId)?.name ?? "—"}{" "}
                      · {formatLong(e.date)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: c.destructive,
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                    }}
                  >
                    -{formatMoney(e.amount, settings.currency)}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.rowBetween}>
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
          color: valueColor ?? c.foreground,
          fontFamily: "Inter_700Bold",
          fontSize: 15,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SplitBar({
  investorPct,
  operatorPct,
}: {
  investorPct: number;
  operatorPct: number;
}) {
  const c = useColors();
  return (
    <View
      style={{
        height: 14,
        flexDirection: "row",
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: c.muted,
      }}
    >
      <View
        style={{
          width: `${investorPct}%`,
          backgroundColor: c.primary,
        }}
      />
      <View
        style={{
          width: `${operatorPct}%`,
          backgroundColor: c.warning,
        }}
      />
    </View>
  );
}

function UnitChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: active ? c.primary : c.muted,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: active ? c.primary : c.border,
        }}
      >
        <Text
          style={{
            color: active ? c.primaryForeground : c.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const CHANNEL_LABEL: Record<string, string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  booking: "Booking.com",
  agoda: "Agoda",
};

function buildSingleUnitPdf(
  unit: Unit,
  bookings: Booking[],
  expenses: Expense[],
  settings: Settings,
  range: { start: string; end: string } | undefined,
  periodLabel: string,
): string {
  let unitBookings = bookings.filter(
    (b) => b.unitId === unit.id && b.status !== "cancelled",
  );
  let unitExpenses = expenses.filter(
    (e) => e.unitId === unit.id || e.unitId === "all",
  );
  if (range) {
    unitBookings = unitBookings.filter(
      (b) => b.checkIn < range.end && b.checkOut > range.start,
    );
    unitExpenses = unitExpenses.filter(
      (e) => e.date >= range.start && e.date <= range.end,
    );
  }

  const totalIncome = unitBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const totalExpensesNum = unitExpenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpensesNum;

  return buildIncomeStatementHtml({
    unitName: unit.name,
    periodLabel,
    startDate: range?.start ?? "—",
    endDate: range?.end ?? "—",
    bookings: unitBookings
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      .map((b) => {
        const nights = Math.max(
          0,
          (parseISODate(b.checkOut).getTime() -
            parseISODate(b.checkIn).getTime()) /
            86400000,
        );
        return {
          date: formatLong(b.checkIn),
          guest: b.guestName,
          channel: CHANNEL_LABEL[b.channel] ?? b.channel,
          nights,
          amount: formatMoney(bookingTotal(b), settings.currency),
        };
      }),
    expenses: unitExpenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: formatLong(e.date),
        category: e.category,
        description: e.description,
        amount: formatMoney(e.amount, settings.currency),
      })),
    totalIncome: formatMoney(totalIncome, settings.currency),
    totalExpenses: formatMoney(totalExpensesNum, settings.currency),
    netProfit: formatMoney(net, settings.currency),
    investorPct: settings.investorSharePct,
    operatorPct: settings.operatorSharePct,
    investorShare: formatMoney(
      (net * settings.investorSharePct) / 100,
      settings.currency,
    ),
    operatorShare: formatMoney(
      (net * settings.operatorSharePct) / 100,
      settings.currency,
    ),
    generatedOn: new Date().toLocaleString(),
    netNegative: net < 0,
  });
}

function buildPortfolioPdf(
  units: Unit[],
  bookings: Booking[],
  expenses: Expense[],
  settings: Settings,
  range: { start: string; end: string } | undefined,
  periodLabel: string,
): string {
  let allBookings = bookings.filter((b) => b.status !== "cancelled");
  let allExpenses = expenses;
  if (range) {
    allBookings = allBookings.filter(
      (b) => b.checkIn < range.end && b.checkOut > range.start,
    );
    allExpenses = allExpenses.filter(
      (e) => e.date >= range.start && e.date <= range.end,
    );
  }

  const totalIncome = allBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const totalExpensesNum = allExpenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpensesNum;
  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";

  return buildIncomeStatementHtml({
    unitName: "All Units · Portfolio",
    periodLabel,
    startDate: range?.start ?? "—",
    endDate: range?.end ?? "—",
    bookings: allBookings
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      .map((b) => {
        const nights = Math.max(
          0,
          (parseISODate(b.checkOut).getTime() -
            parseISODate(b.checkIn).getTime()) /
            86400000,
        );
        return {
          date: `${formatLong(b.checkIn)} (${unitName(b.unitId)})`,
          guest: b.guestName,
          channel: CHANNEL_LABEL[b.channel] ?? b.channel,
          nights,
          amount: formatMoney(bookingTotal(b), settings.currency),
        };
      }),
    expenses: allExpenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: `${formatLong(e.date)} (${e.unitId === "all" ? "All units" : unitName(e.unitId)})`,
        category: e.category,
        description: e.description,
        amount: formatMoney(e.amount, settings.currency),
      })),
    totalIncome: formatMoney(totalIncome, settings.currency),
    totalExpenses: formatMoney(totalExpensesNum, settings.currency),
    netProfit: formatMoney(net, settings.currency),
    investorPct: settings.investorSharePct,
    operatorPct: settings.operatorSharePct,
    investorShare: formatMoney(
      (net * settings.investorSharePct) / 100,
      settings.currency,
    ),
    operatorShare: formatMoney(
      (net * settings.operatorSharePct) / 100,
      settings.currency,
    ),
    generatedOn: new Date().toLocaleString(),
    netNegative: net < 0,
  });
}

const styles = StyleSheet.create({
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barTrack: {
    height: 6,
    width: "100%",
    marginTop: 12,
    overflow: "hidden",
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  expenseIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
