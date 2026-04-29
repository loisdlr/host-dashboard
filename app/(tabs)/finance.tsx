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
      
      if (targetUnits.length === 0 && unitId !== "all") {
        Alert.alert("No unit selected");
        return;
      }

      const html =
        unitId === "all"
          ? buildPortfolioPdf(units, bookings, expenses, settings, range, periodLabel)
          : buildSingleUnitPdf(targetUnits[0]!, bookings, expenses, settings, range, periodLabel);

      await exportPdf({
        html,
        filename: `${unitId === "all" ? "Portfolio" : (targetUnits[0]?.name ?? "Unit")}-Statement.pdf`,
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
          paddingBottom: insets.bottom + 20,
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
          onChange={(v) => setPeriod(v as Period)}
        />

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

        <Card>
          <Text style={styles.statLabel}>Net profit · {periodLabel}</Text>
          <Text style={[styles.statValue, { color: result.net >= 0 ? c.foreground : c.destructive }]}>
            {formatMoney(result.net, settings.currency)}
          </Text>
          <View style={[styles.divider, { borderColor: c.border, marginVertical: 14 }]} />
          <View style={{ gap: 10 }}>
            <Row
              label="Gross income"
              value={formatMoney(result.gross, settings.currency)}
            />
            <Row
              label="Expenses"
              value={`- ${formatMoney(result.expenses, settings.currency)}`}
              valueColor={c.destructive}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Profit distribution</Text>
              <Text style={styles.cardSubtitle}>
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
              <Text style={styles.statLabel}>Investor</Text>
              <Text style={[styles.splitValue, { color: c.primary }]}>
                {formatMoney(result.investorShare, settings.currency)}
              </Text>
            </View>
            <View style={[styles.divider, { borderColor: c.border, height: 40, borderRightWidth: StyleSheet.hairlineWidth }]} />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.statLabel}>Operator</Text>
              <Text style={styles.splitValue}>
                {formatMoney(result.operatorShare, settings.currency)}
              </Text>
            </View>
          </View>
        </Card>

        <Button
          label={unitId === "all" ? "Export portfolio PDF" : "Export unit PDF"}
          variant="secondary"
          icon={<Feather name="file-text" size={16} color={c.foreground} />}
          onPress={onExportPdf}
          fullWidth
        />

        {unitId === "all" && (
          <View>
            <Text style={styles.sectionTitle}>By unit</Text>
            <View style={{ gap: 10 }}>
              {unitBreakdown.map(({ unit, split }) => (
                <Card key={unit.id} style={{ padding: 14 }}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.unitName}>{unit.name}</Text>
                      <Text style={styles.unitDetails}>
                        {formatMoney(split.gross, settings.currency)} gross
                      </Text>
                    </View>
                    <Text style={[styles.unitNet, { color: split.net >= 0 ? c.foreground : c.destructive }]}>
                      {formatMoney(split.net, settings.currency)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        <View>
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
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
              <EmptyState icon="dollar-sign" title="No expenses yet" description="Track your costs here." />
            ) : (
              recentExpenses.map((e, idx) => (
                <View key={e.id} style={[styles.expenseRow, { borderTopColor: c.border, borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                    <Text style={styles.expenseMeta}>{formatLong(e.date)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(e.amount, settings.currency)}</Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const c = useColors();
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor ?? c.foreground, fontFamily: "Inter_700Bold", fontSize: 15 }}>{value}</Text>
    </View>
  );
}

function SplitBar({ investorPct, operatorPct }: { investorPct: number; operatorPct: number }) {
  const c = useColors();
  return (
    <View style={{ height: 12, flexDirection: "row", borderRadius: 6, overflow: "hidden", backgroundColor: c.muted }}>
      <View style={{ width: `${investorPct}%`, backgroundColor: c.primary }} />
      <View style={{ width: `${operatorPct}%`, backgroundColor: c.warning }} />
    </View>
  );
}

function UnitChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? c.primary : c.muted, borderColor: active ? c.primary : c.border }]}>
      <Text style={{ color: active ? c.primaryForeground : c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

// PDF Generators
const CHANNEL_LABEL: Record<string, string> = { direct: "Direct", airbnb: "Airbnb", booking: "Booking.com", agoda: "Agoda" };

function buildSingleUnitPdf(unit: Unit, bookings: Booking[], expenses: Expense[], settings: Settings, range: any, periodLabel: string) {
  const unitBookings = bookings.filter(b => b.unitId === unit.id && b.status !== "cancelled");
  const unitExpenses = expenses.filter(e => e.unitId === unit.id || e.unitId === "all");
  const gross = unitBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const exps = unitExpenses.reduce((s, e) => s + e.amount, 0);
  const net = gross - exps;

  return buildIncomeStatementHtml({
    unitName: unit.name,
    periodLabel,
    startDate: range?.start ?? "Start",
    endDate: range?.end ?? "End",
    bookings: unitBookings.map(b => ({ date: formatLong(b.checkIn), guest: b.guestName, channel: CHANNEL_LABEL[b.channel] ?? b.channel, nights: 1, amount: formatMoney(bookingTotal(b), settings.currency) })),
    expenses: unitExpenses.map(e => ({ date: formatLong(e.date), category: e.category, description: e.description, amount: formatMoney(e.amount, settings.currency) })),
    totalIncome: formatMoney(gross, settings.currency),
    totalExpenses: formatMoney(exps, settings.currency),
    netProfit: formatMoney(net, settings.currency),
    investorPct: settings.investorSharePct,
    operatorPct: settings.operatorSharePct,
    investorShare: formatMoney((net * settings.investorSharePct) / 100, settings.currency),
    operatorShare: formatMoney((net * settings.operatorSharePct) / 100, settings.currency),
    generatedOn: new Date().toLocaleDateString(),
    netNegative: net < 0
  });
}

function buildPortfolioPdf(units: Unit[], bookings: Booking[], expenses: Expense[], settings: Settings, range: any, periodLabel: string) {
  const gross = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + bookingTotal(b), 0);
  const exps = expenses.reduce((s, e) => s + e.amount, 0);
  const net = gross - exps;

  return buildIncomeStatementHtml({
    unitName: "Portfolio (All Units)",
    periodLabel,
    startDate: range?.start ?? "Start",
    endDate: range?.end ?? "End",
    bookings: bookings.map(b => ({ date: formatLong(b.checkIn), guest: b.guestName, channel: CHANNEL_LABEL[b.channel] ?? b.channel, nights: 1, amount: formatMoney(bookingTotal(b), settings.currency) })),
    expenses: expenses.map(e => ({ date: formatLong(e.date), category: e.category, description: e.description, amount: formatMoney(e.amount, settings.currency) })),
    totalIncome: formatMoney(gross, settings.currency),
    totalExpenses: formatMoney(exps, settings.currency),
    netProfit: formatMoney(net, settings.currency),
    investorPct: settings.investorSharePct,
    operatorPct: settings.operatorSharePct,
    investorShare: formatMoney((net * settings.investorSharePct) / 100, settings.currency),
    operatorShare: formatMoney((net * settings.operatorSharePct) / 100, settings.currency),
    generatedOn: new Date().toLocaleDateString(),
    netNegative: net < 0
  });
}

const styles = StyleSheet.create({
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { color: "#64748b", fontFamily: "Inter_500Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 32, marginTop: 4 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cardSubtitle: { color: "#64748b", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  splitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  splitValue: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  unitName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  unitDetails: { color: "#64748b", fontSize: 11, marginTop: 2 },
  unitNet: { fontFamily: "Inter_700Bold", fontSize: 15 },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  expenseDesc: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  expenseMeta: { color: "#64748b", fontSize: 11, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontFamily: "Inter_700Bold", fontSize: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }
});