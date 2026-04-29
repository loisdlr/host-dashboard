import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { ChannelBadge } from "@/components/ChannelBadge";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import {
  addDays,
  formatLong,
  parseISODate,
  todayISO,
  toISODate,
  ymKey,
} from "@/utils/date";
import {
  bookingTotal,
  formatMoney,
  incomeForMonth,
  totalExpenses,
} from "@/utils/finance";

export default function DashboardScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    bookings,
    units,
    expenses,
    bills,
    cleaners,
    jobs,
    settings,
  } = useRental();

  const today = todayISO();
  const ym = ymKey(today);
  const next30 = toISODate(addDays(parseISODate(today), 30));

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings],
  );

  const todaysStays = useMemo(
    () =>
      activeBookings.filter(
        (b) => b.checkIn <= today && b.checkOut > today,
      ),
    [activeBookings, today],
  );

  const todaysCheckIns = useMemo(
    () => activeBookings.filter((b) => b.checkIn === today),
    [activeBookings, today],
  );

  const todaysCheckOuts = useMemo(
    () => activeBookings.filter((b) => b.checkOut === today),
    [activeBookings, today],
  );

  const monthIncome = useMemo(
    () => incomeForMonth(activeBookings, ym),
    [activeBookings, ym],
  );

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => ymKey(e.date) === ym)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, ym]);

  const occupancyPct = useMemo(() => {
    if (units.length === 0) return 0;
    return Math.round((todaysStays.length / units.length) * 100);
  }, [todaysStays.length, units.length]);

  const upcomingDues = useMemo(() => {
    const now = parseISODate(today);
    const list: { bill: typeof bills[number]; dueDate: string; daysAway: number }[] =
      [];
    bills.forEach((bill) => {
      const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
      if (dueThisMonth < now) {
        dueThisMonth.setMonth(dueThisMonth.getMonth() + 1);
      }
      const dueDate = toISODate(dueThisMonth);
      const monthKey = ymKey(dueDate);
      if (bill.paidMonths.includes(monthKey)) return;
      const days = Math.ceil(
        (dueThisMonth.getTime() - now.getTime()) / 86_400_000,
      );
      if (days <= 14) {
        list.push({ bill, dueDate, daysAway: days });
      }
    });
    return list.sort((a, b) => a.daysAway - b.daysAway).slice(0, 5);
  }, [bills, today]);

  const upcomingBookings = useMemo(
    () =>
      activeBookings
        .filter((b) => b.checkIn > today && b.checkIn <= next30)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
        .slice(0, 4),
    [activeBookings, today, next30],
  );

  const cleanerSummary = useMemo(() => {
    const upcomingJobs = jobs.filter((j) => j.date >= today);
    const unpaidJobs = jobs.filter((j) => !j.paid);
    const unpaidAmount = unpaidJobs.reduce((s, j) => s + j.amount, 0);
    return {
      upcoming: upcomingJobs.length,
      unpaid: unpaidJobs.length,
      unpaidAmount,
    };
  }, [jobs, today]);

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 110,
        }}
      >
        {/* Hero */}
        <LinearGradient
          colors={[c.primary, "#0A5C5B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 18) : insets.top) + 18,
            paddingHorizontal: 20,
            paddingBottom: 30,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <View style={styles.heroTop}>
            <View>
              <Text
                style={{
                  color: "#FFFFFF99",
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {formatLong(today)}
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter_700Bold",
                  fontSize: 26,
                  marginTop: 6,
                }}
              >
                Good day
              </Text>
              <Text
                style={{
                  color: "#FFFFFFCC",
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  marginTop: 2,
                }}
              >
                Here's what's happening across your {units.length} units.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/booking/new")}
              style={({ pressed }) => [
                styles.heroBtn,
                {
                  backgroundColor: "#FFFFFF",
                  opacity: pressed ? 0.85 : 1,
                  borderRadius: c.radius,
                },
              ]}
            >
              <Feather name="plus" size={20} color={c.primary} />
            </Pressable>
          </View>

          <View style={styles.heroStats}>
            <HeroStat
              label="Occupancy"
              value={`${occupancyPct}%`}
              hint={`${todaysStays.length} of ${units.length}`}
            />
            <View style={[styles.heroDivider, { backgroundColor: "#FFFFFF22" }]} />
            <HeroStat
              label="This month"
              value={formatMoney(monthIncome, settings.currency)}
              hint={`Net ${formatMoney(monthIncome - monthExpenses, settings.currency)}`}
            />
            <View style={[styles.heroDivider, { backgroundColor: "#FFFFFF22" }]} />
            <HeroStat
              label="Today"
              value={String(todaysCheckIns.length + todaysCheckOuts.length)}
              hint={`${todaysCheckIns.length} in · ${todaysCheckOuts.length} out`}
            />
          </View>
        </LinearGradient>

        {/* Summary cards */}
        <View style={[styles.section, { paddingTop: 18 }]}>
          <View style={styles.statRow}>
            <View style={{ flex: 1 }}>
              <StatCard
                label="Income"
                value={formatMoney(monthIncome, settings.currency)}
                hint="This month"
                accent={c.primary}
                compact
                icon={<Feather name="trending-up" size={16} color={c.primary} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard
                label="Expenses"
                value={formatMoney(monthExpenses, settings.currency)}
                hint="This month"
                accent={c.destructive}
                compact
                icon={
                  <Feather name="trending-down" size={16} color={c.destructive} />
                }
              />
            </View>
          </View>
          <View style={[styles.statRow, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <StatCard
                label="Cleaners"
                value={String(cleaners.length)}
                hint={`${cleanerSummary.upcoming} jobs queued`}
                compact
                icon={<Feather name="users" size={16} color={c.foreground} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard
                label="Unpaid"
                value={formatMoney(cleanerSummary.unpaidAmount, settings.currency)}
                hint={`${cleanerSummary.unpaid} cleanings`}
                accent={cleanerSummary.unpaidAmount > 0 ? c.warning : c.foreground}
                compact
                icon={
                  <Feather
                    name="alert-circle"
                    size={16}
                    color={cleanerSummary.unpaidAmount > 0 ? c.warning : c.mutedForeground}
                  />
                }
              />
            </View>
          </View>
        </View>

        {/* Today */}
        <View style={styles.section}>
          <SectionTitle
            title="Today"
            subtitle={`${todaysStays.length} active stay${todaysStays.length === 1 ? "" : "s"}`}
            actionLabel="See calendar"
            onAction={() => router.push("/(tabs)/calendar")}
          />
          {todaysStays.length === 0 && todaysCheckIns.length === 0 && todaysCheckOuts.length === 0 ? (
            <Card>
              <EmptyState
                icon="sun"
                title="Nothing on today"
                description="No active stays, check-ins, or check-outs scheduled."
              />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {todaysCheckIns.map((b) => (
                <BookingRow
                  key={b.id}
                  unitName={unitName(b.unitId)}
                  guestName={b.guestName}
                  channel={b.channel}
                  badge="Check-in"
                  badgeColor={c.success}
                  amount={formatMoney(bookingTotal(b), settings.currency)}
                  onPress={() => router.push({ pathname: "/booking/[id]", params: { id: b.id } })}
                />
              ))}
              {todaysCheckOuts.map((b) => (
                <BookingRow
                  key={b.id}
                  unitName={unitName(b.unitId)}
                  guestName={b.guestName}
                  channel={b.channel}
                  badge="Check-out"
                  badgeColor={c.warning}
                  amount={formatMoney(bookingTotal(b), settings.currency)}
                  onPress={() => router.push({ pathname: "/booking/[id]", params: { id: b.id } })}
                />
              ))}
              {todaysStays
                .filter(
                  (b) =>
                    !todaysCheckIns.some((x) => x.id === b.id) &&
                    !todaysCheckOuts.some((x) => x.id === b.id),
                )
                .map((b) => (
                  <BookingRow
                    key={b.id}
                    unitName={unitName(b.unitId)}
                    guestName={b.guestName}
                    channel={b.channel}
                    badge="Staying"
                    badgeColor={c.primary}
                    amount={formatMoney(bookingTotal(b), settings.currency)}
                    onPress={() =>
                      router.push({ pathname: "/booking/[id]", params: { id: b.id } })
                    }
                  />
                ))}
            </View>
          )}
        </View>

        {/* Upcoming */}
        <View style={styles.section}>
          <SectionTitle
            title="Upcoming"
            subtitle="Next 30 days"
            actionLabel="All bookings"
            onAction={() => router.push("/(tabs)/bookings")}
          />
          {upcomingBookings.length === 0 ? (
            <Card>
              <EmptyState
                icon="calendar"
                title="No upcoming bookings"
                description="Your next reservations will appear here."
              />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {upcomingBookings.map((b) => (
                <BookingRow
                  key={b.id}
                  unitName={unitName(b.unitId)}
                  guestName={b.guestName}
                  channel={b.channel}
                  badge={formatLong(b.checkIn).split(",")[0]}
                  badgeColor={c.foreground}
                  amount={formatMoney(bookingTotal(b), settings.currency)}
                  onPress={() => router.push({ pathname: "/booking/[id]", params: { id: b.id } })}
                />
              ))}
            </View>
          )}
        </View>

        {/* Reminders / dues */}
        <View style={styles.section}>
          <SectionTitle
            title="Reminders"
            subtitle="Bills coming due"
            actionLabel="All dues"
            onAction={() => router.push("/dues")}
          />
          {upcomingDues.length === 0 ? (
            <Card>
              <EmptyState
                icon="check-circle"
                title="All caught up"
                description="No bills due in the next two weeks."
              />
            </Card>
          ) : (
            <View style={{ gap: 8 }}>
              {upcomingDues.map(({ bill, dueDate, daysAway }) => (
                <Card key={bill.id} style={{ padding: 14 }}>
                  <View style={styles.dueRow}>
                    <View
                      style={[
                        styles.dueDayChip,
                        {
                          backgroundColor:
                            daysAway <= 3 ? c.destructive + "1A" : c.muted,
                          borderRadius: c.radius - 6,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: daysAway <= 3 ? c.destructive : c.foreground,
                          fontFamily: "Inter_700Bold",
                          fontSize: 18,
                        }}
                      >
                        {daysAway < 0 ? 0 : daysAway}
                      </Text>
                      <Text
                        style={{
                          color: daysAway <= 3 ? c.destructive : c.mutedForeground,
                          fontFamily: "Inter_500Medium",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        days
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 15,
                        }}
                      >
                        {bill.name}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {unitName(bill.unitId)} · due {formatLong(dueDate)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                      }}
                    >
                      {formatMoney(bill.amount, settings.currency)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Cleaners */}
        <View style={[styles.section, { paddingBottom: 28 }]}>
          <SectionTitle
            title="Cleaners assigned"
            subtitle={`${cleaners.length} active`}
            actionLabel="Manage"
            onAction={() => router.push("/cleaners")}
          />
          <Card>
            {cleaners.length === 0 ? (
              <EmptyState
                icon="users"
                title="No cleaners yet"
                description="Add cleaners to assign jobs and track payments."
              />
            ) : (
              cleaners.map((cl, idx) => {
                const cleanerJobs = jobs.filter((j) => j.cleanerId === cl.id);
                const unpaid = cleanerJobs
                  .filter((j) => !j.paid)
                  .reduce((s, j) => s + j.amount, 0);
                return (
                  <View
                    key={cl.id}
                    style={[
                      styles.cleanerRow,
                      idx > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: c.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: c.accent },
                      ]}
                    >
                      <Text
                        style={{
                          color: c.primary,
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                        }}
                      >
                        {cl.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                        }}
                      >
                        {cl.name}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {cleanerJobs.length} job{cleanerJobs.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: unpaid > 0 ? c.warning : c.success,
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                        }}
                      >
                        {unpaid > 0 ? formatMoney(unpaid, settings.currency) : "Paid"}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {unpaid > 0 ? "unpaid" : "all clear"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: "#FFFFFF99",
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "Inter_700Bold",
          fontSize: 18,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: "#FFFFFFAA",
          fontFamily: "Inter_400Regular",
          fontSize: 11,
          marginTop: 2,
        }}
      >
        {hint}
      </Text>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text
          style={{
            color: c.foreground,
            fontFamily: "Inter_700Bold",
            fontSize: 18,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text
            style={{
              color: c.primary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BookingRow({
  unitName,
  guestName,
  channel,
  badge,
  badgeColor,
  amount,
  onPress,
}: {
  unitName: string;
  guestName: string;
  channel: import("@/types").Channel;
  badge: string;
  badgeColor: string;
  amount: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card
          style={{
            padding: 14,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <View style={styles.bookingRow}>
            <View
              style={[
                styles.bookingBadge,
                {
                  backgroundColor: badgeColor + "1A",
                  borderRadius: c.radius - 6,
                },
              ]}
            >
              <Text
                style={{
                  color: badgeColor,
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {badge}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                }}
                numberOfLines={1}
              >
                {guestName}
              </Text>
              <Text
                style={{
                  color: c.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {unitName}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text
                style={{
                  color: c.foreground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                }}
              >
                {amount}
              </Text>
              <ChannelBadge channel={channel} />
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStats: {
    flexDirection: "row",
    marginTop: 22,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDayChip: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  cleanerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
