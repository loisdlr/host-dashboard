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
// New Imports for Swipe
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

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
import { exportPdf } from "@/utils/pdf";

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
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, range]);

  const handleDelete = (id: string, desc: string) => {
    Alert.alert("Delete Expense", `Remove "${desc}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense(id) }
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader
          title="Finance"
          rightIcon="settings"
          onRightPress={() => router.push("/settings")}
        />

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 16 }}>
          {/* ... [Rest of your Summary Cards and Unit Chips remain the same] ... */}

          <View>
            <View style={[styles.rowBetween, { marginBottom: 10 }]}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <Button
                label="Add"
                size="sm"
                variant="secondary"
                icon={<Feather name="plus" size={14} color={c.foreground} />}
                onPress={() => router.push("/expense/new")}
              />
            </View>
            
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {recentExpenses.length === 0 ? (
                <EmptyState icon="dollar-sign" title="No expenses" />
              ) : (
                recentExpenses.map((e, idx) => (
                  <SwipeableExpense
                    key={e.id}
                    expense={e}
                    isLast={idx === recentExpenses.length - 1}
                    onDelete={() => handleDelete(e.id, e.description || e.category)}
                    onEdit={() => router.push({ pathname: "/expense/new", params: { id: e.id } })}
                  />
                ))
              )}
            </Card>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

// Sub-component for the Swipe Action
function SwipeableExpense({ expense, isLast, onDelete, onEdit }: any) {
  const c = useColors();
  const { settings } = useRental();

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <Pressable onPress={onEdit} style={[styles.swipeBtn, { backgroundColor: c.muted }]}>
        <Feather name="edit-2" size={18} color={c.foreground} />
      </Pressable>
      <Pressable onPress={onDelete} style={[styles.swipeBtn, { backgroundColor: '#fee2e2' }]}>
        <Feather name="trash-2" size={18} color="#ef4444" />
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
      <View style={[
        styles.expenseRow, 
        { 
          backgroundColor: c.card,
          borderBottomColor: c.border, 
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth 
        }
      ]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseDesc}>{expense.description || expense.category}</Text>
          <Text style={styles.expenseMeta}>{formatLong(expense.date)}</Text>
        </View>
        <Text style={styles.expenseAmount}>-{formatMoney(expense.amount, settings.currency)}</Text>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // ... [Keep your existing styles] ...
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  expenseDesc: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  expenseMeta: { color: "#64748b", fontSize: 11, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontFamily: "Inter_700Bold", fontSize: 14 },
  swipeActions: { flexDirection: 'row', width: 140 },
  swipeBtn: { width: 70, justifyContent: 'center', alignItems: 'center' },
});