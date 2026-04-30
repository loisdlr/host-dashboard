import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
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
  formatMoney,
  splitForAll,
  splitForUnit,
} from "@/utils/finance";
import { buildSingleUnitPdf, buildPortfolioPdf, exportPdf } from "@/utils/pdf";
import type { Expense } from "@/types";

type Period = "month" | "ytd" | "all";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

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

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // ==================== HANDLERS ====================

  const onExportPdf = async () => {
    try {
      const targetUnits = unitId === "all" 
        ? units 
        : units.filter((u) => u.id === unitId);

      if (targetUnits.length === 0) {
        alert("No unit selected");
        return;
      }

      const html = unitId === "all"
        ? buildPortfolioPdf(units, bookings, expenses, settings, range, periodLabel)
        : buildSingleUnitPdf(targetUnits[0]!, bookings, expenses, settings, range, periodLabel);

      await exportPdf({
        html,
        filename: `${unitId === "all" ? "Portfolio" : (targetUnits[0]?.name ?? "Unit")}-Statement.pdf`,
      });

      alert("PDF exported successfully!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not export PDF.";
      alert(`Export failed: ${message}`);
    }
  };

  const handleDeleteExpense = (id: string, swipeable?: SwipeableMethods) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this expense?\n\n${expense.description || expense.category} - ${formatMoney(expense.amount, settings.currency)}`
    );

    if (confirmed) {
      deleteExpense(id);
      swipeable?.close();
    } else {
      swipeable?.close();
    }
  };

  const handleEditExpense = (id: string, swipeable?: SwipeableMethods) => {
    swipeable?.close();
    router.push(`/expense/${id}`);
  };

  // Right Swipe Actions
  const renderRightActions = (
    prog: SharedValue<number>,
    drag: SharedValue<number>,
    swipeable: SwipeableMethods,
    expenseId: string
  ) => {
    const styleAnimation = useAnimatedStyle(() => ({
      transform: [{ translateX: drag.value + 160 }],
    }));

    return (
      <Reanimated.View style={[styleAnimation, styles.actionsContainer]}>
        <TouchableOpacity
          onPress={() => handleEditExpense(expenseId, swipeable)}
          style={[styles.actionButton, { backgroundColor: c.accent }]}
        >
          <Feather name="edit-2" size={20} color={c.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteExpense(expenseId, swipeable)}
          style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
        >
          <Feather name="trash-2" size={20} color="white" />
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Finance" 
        subtitle={periodLabel} 
        rightIcon="settings" 
        onRightPress={() => router.push("/settings")} 
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 16 }}>
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map((u) => (
            <UnitChip key={u.id} label={u.name} active={unitId === u.id} onPress={() => setUnitId(u.id)} />
          ))}
        </ScrollView>

        <Button
          label={unitId === "all" ? "Export Portfolio PDF" : `Export ${units.find((u) => u.id === unitId)?.name ?? "Unit"} PDF`}
          variant="secondary"
          icon={<Feather name="file-text" size={16} color={c.foreground} />}
          onPress={onExportPdf}
          fullWidth
        />

        {/* Net Profit Card */}
        <Card>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Net profit · {periodLabel}</Text>
          <Text style={[styles.statValue, { color: result.net >= 0 ? c.foreground : c.destructive }]}>
            {formatMoney(result.net, settings.currency)}
          </Text>
          <View style={[styles.divider, { borderColor: c.border, marginVertical: 14 }]} />
          <View style={{ gap: 10 }}>
            <Row label="Gross income" value={formatMoney(result.gross, settings.currency)} />
            <Row label="Expenses" value={`- ${formatMoney(result.expenses, settings.currency)}`} valueColor={c.destructive} />
          </View>
        </Card>

        {/* Profit Distribution Card */}
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>Profit distribution</Text>
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                {settings.investorSharePct}% investor · {settings.operatorSharePct}% operator
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={() => router.push("/settings")}>
              <Feather name="sliders" size={18} color={c.primary} />
            </Pressable>
          </View>
          <View style={{ marginTop: 16 }}>
            <SplitBar investorPct={settings.investorSharePct} operatorPct={settings.operatorSharePct} />
          </View>
          <View style={[styles.splitRow, { marginTop: 18 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.splitLabel, { color: c.mutedForeground }]}>Investor ({settings.investorSharePct}%)</Text>
              <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 22 }}>{formatMoney(result.investorShare, settings.currency)}</Text>
            </View>
            <View style={[styles.divider, { borderColor: c.border, height: 40, borderRightWidth: StyleSheet.hairlineWidth }]} />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.splitLabel, { color: c.mutedForeground }]}>Operator ({settings.operatorSharePct}%)</Text>
              <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 22 }}>{formatMoney(result.operatorShare, settings.currency)}</Text>
            </View>
          </View>
        </Card>

        {/* Recent Expenses */}
        <View>
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>Recent expenses</Text>
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              icon={<Feather name="plus" size={14} color={c.foreground} />}
              onPress={() => router.push("/expense/new")}
            />
          </View>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {recentExpenses.length === 0 ? (
              <EmptyState icon="dollar-sign" title="No expenses yet" description="Track repairs and bills here." />
            ) : (
              recentExpenses.map((e, idx) => (
                <ReanimatedSwipeable
                  key={e.id}
                  friction={2}
                  rightThreshold={50}
                  renderRightActions={(prog, drag, sw) => renderRightActions(prog, drag, sw, e.id)}
                >
                  <Pressable
                    onPress={() => router.push(`/expense/${e.id}`)}
                    style={({ pressed }) => [
                      styles.expenseRow,
                      { 
                        backgroundColor: pressed ? c.accent : c.card,
                        borderTopColor: c.border,
                        borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth 
                      }
                    ]}
                  >
                    <View style={[styles.expenseIcon, { backgroundColor: c.accent }]}>
                      <Feather name="tag" size={14} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                      <Text style={styles.expenseMeta}>
                        {e.category} · {units.find((u) => u.id === e.unitId)?.name ?? "All Units"} · {formatLong(e.date)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      -{formatMoney(e.amount, settings.currency)}
                    </Text>
                  </Pressable>
                </ReanimatedSwipeable>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

/* ====================== Helper Components ====================== */
function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const c = useColors();
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor ?? c.foreground, fontWeight: "700", fontSize: 15 }}>{value}</Text>
    </View>
  );
}

function SplitBar({ investorPct, operatorPct }: { investorPct: number; operatorPct: number }) {
  const c = useColors();
  return (
    <View style={{ height: 14, flexDirection: "row", borderRadius: 999, overflow: "hidden", backgroundColor: c.muted }}>
      <View style={{ width: `${investorPct}%`, backgroundColor: c.primary }} />
      <View style={{ width: `${operatorPct}%`, backgroundColor: c.warning }} />
    </View>
  );
}

function UnitChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress}>
      <View style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? c.primary : c.muted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? c.primary : c.border
      }}>
        <Text style={{ color: active ? c.primaryForeground : c.foreground, fontWeight: "600", fontSize: 12 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  splitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 32, marginTop: 6, fontWeight: "700" },
  splitLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  expenseRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 12 
  },
  expenseIcon: { 
    width: 32, 
    height: 32, 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 8 
  },
  expenseDesc: { fontWeight: "600", fontSize: 14 },
  expenseMeta: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
  actionsContainer: { flexDirection: "row", width: 160, height: "100%" },
  actionButton: { 
    width: 80, 
    height: "100%", 
    justifyContent: "center", 
    alignItems: "center" 
  },
});