import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { DateInput } from "@/components/DateInput";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { todayISO, formatLong } from "@/utils/date";
import { formatMoney } from "@/utils/finance";

export default function CleanersScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    cleaners,
    jobs,
    units,
    addCleaner,
    addJob,
    updateJob,
    deleteJob,
    deleteCleaner,
    settings,
  } = useRental();

  const [tab, setTab] = useState<"cleaners" | "jobs">("cleaners");
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  // add cleaner form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState(String(settings.cleaningFee));

  // add job form
  const [jobUnitId, setJobUnitId] = useState(units[0]?.id ?? "");
  const [jobCleanerId, setJobCleanerId] = useState(cleaners[0]?.id ?? "");
  const [jobDate, setJobDate] = useState(todayISO());
  const [jobAmount, setJobAmount] = useState(
    String(cleaners[0]?.ratePerClean ?? settings.cleaningFee),
  );
  const [jobNotes, setJobNotes] = useState("");

  const summary = useMemo(() => {
    return cleaners.map((cl) => {
      const cJobs = jobs.filter((j) => j.cleanerId === cl.id);
      const paid = cJobs.filter((j) => j.paid).reduce((s, j) => s + j.amount, 0);
      const unpaid = cJobs
        .filter((j) => !j.paid)
        .reduce((s, j) => s + j.amount, 0);
      return { cleaner: cl, paid, unpaid, count: cJobs.length };
    });
  }, [cleaners, jobs]);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => b.date.localeCompare(a.date)),
    [jobs],
  );

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";
  const cleanerName = (id: string) =>
    cleaners.find((c) => c.id === id)?.name ?? "—";

  const submitCleaner = () => {
    if (!name.trim()) {
      Alert.alert("Enter a name");
      return;
    }
    addCleaner({
      name: name.trim(),
      phone: phone.trim() || undefined,
      ratePerClean: Number(rate) || settings.cleaningFee,
    });
    setName("");
    setPhone("");
    setRate(String(settings.cleaningFee));
    setShowAddCleaner(false);
  };

  const submitJob = () => {
    if (!jobUnitId || !jobCleanerId) {
      Alert.alert("Pick a unit and cleaner");
      return;
    }
    const value = Number(jobAmount);
    if (!value || value <= 0) {
      Alert.alert("Enter amount");
      return;
    }
    addJob({
      unitId: jobUnitId,
      cleanerId: jobCleanerId,
      date: jobDate,
      amount: value,
      paid: false,
      notes: jobNotes.trim() || undefined,
    });
    setJobNotes("");
    setShowAddJob(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Cleaners"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
        rightIcon="plus"
        onRightPress={() =>
          tab === "cleaners" ? setShowAddCleaner(true) : setShowAddJob(true)
        }
      />
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SegmentedControl
          options={[
            { value: "cleaners", label: "Cleaners" },
            { value: "jobs", label: "Jobs & payments" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 12,
        }}
      >
        {tab === "cleaners" ? (
          summary.length === 0 ? (
            <Card>
              <EmptyState
                icon="users"
                title="No cleaners yet"
                description="Add cleaners to assign jobs and track payments."
                action={
                  <Button
                    label="Add cleaner"
                    onPress={() => setShowAddCleaner(true)}
                  />
                }
              />
            </Card>
          ) : (
            summary.map(({ cleaner, paid, unpaid, count }) => (
              <Card key={cleaner.id}>
                <View style={styles.cleanerHead}>
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
                        fontSize: 16,
                      }}
                    >
                      {cleaner.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 16,
                      }}
                    >
                      {cleaner.name}
                    </Text>
                    {cleaner.phone ? (
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {cleaner.phone}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert("Remove cleaner", `Remove ${cleaner.name}?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => deleteCleaner(cleaner.id),
                        },
                      ])
                    }
                  >
                    <Feather name="trash-2" size={16} color={c.mutedForeground} />
                  </Pressable>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 14,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: c.border,
                    paddingTop: 14,
                    gap: 12,
                  }}
                >
                  <Stat
                    label="Jobs"
                    value={String(count)}
                    color={c.foreground}
                  />
                  <Stat
                    label="Paid"
                    value={formatMoney(paid, settings.currency)}
                    color={c.success}
                  />
                  <Stat
                    label="Unpaid"
                    value={formatMoney(unpaid, settings.currency)}
                    color={unpaid > 0 ? c.warning : c.mutedForeground}
                  />
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
                      Rate
                    </Text>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      {formatMoney(cleaner.ratePerClean, settings.currency)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )
        ) : sortedJobs.length === 0 ? (
          <Card>
            <EmptyState
              icon="check-square"
              title="No cleaning jobs yet"
              description="Schedule cleanings and mark them as paid."
              action={<Button label="Add job" onPress={() => setShowAddJob(true)} />}
            />
          </Card>
        ) : (
          sortedJobs.map((j) => (
            <Card key={j.id}>
              <View style={styles.jobRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: c.foreground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {cleanerName(j.cleanerId)}
                  </Text>
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {unitName(j.unitId)} · {formatLong(j.date)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: c.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                  }}
                >
                  {formatMoney(j.amount, settings.currency)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <Pressable
                  onPress={() =>
                    updateJob(j.id, {
                      paid: !j.paid,
                      paidAt: !j.paid ? new Date().toISOString() : undefined,
                    })
                  }
                  style={({ pressed }) => [
                    styles.payToggle,
                    {
                      backgroundColor: j.paid ? c.success : c.muted,
                      borderRadius: c.radius - 4,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={j.paid ? "check-circle" : "circle"}
                    size={14}
                    color={j.paid ? "#FFFFFF" : c.foreground}
                  />
                  <Text
                    style={{
                      color: j.paid ? "#FFFFFF" : c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      marginLeft: 6,
                    }}
                  >
                    {j.paid ? "Paid" : "Mark paid"}
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable hitSlop={10} onPress={() => deleteJob(j.id)}>
                  <Feather name="trash-2" size={16} color={c.mutedForeground} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add cleaner modal */}
      <Modal
        visible={showAddCleaner}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCleaner(false)}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader
            title="Add cleaner"
            leftIcon="x"
            onLeftPress={() => setShowAddCleaner(false)}
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            <Field label="Name" value={name} onChangeText={setName} />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Field
              label="Rate per clean"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />
            <Button label="Save" onPress={submitCleaner} fullWidth />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      {/* Add job modal */}
      <Modal
        visible={showAddJob}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddJob(false)}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader
            title="Add cleaning job"
            leftIcon="x"
            onLeftPress={() => setShowAddJob(false)}
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            {cleaners.length === 0 ? (
              <EmptyState
                icon="users"
                title="Add a cleaner first"
                description="You need at least one cleaner to assign a job."
              />
            ) : (
              <>
                <Picker
                  label="Cleaner"
                  value={jobCleanerId}
                  options={cleaners.map((cl) => ({
                    value: cl.id,
                    label: cl.name,
                  }))}
                  onChange={(v) => {
                    setJobCleanerId(v);
                    const cl = cleaners.find((c) => c.id === v);
                    if (cl) setJobAmount(String(cl.ratePerClean));
                  }}
                />
                <Picker
                  label="Unit"
                  value={jobUnitId}
                  options={units.map((u) => ({ value: u.id, label: u.name }))}
                  onChange={setJobUnitId}
                />
                <DateInput label="Date" value={jobDate} onChange={setJobDate} />
                <Field
                  label="Amount"
                  value={jobAmount}
                  onChangeText={setJobAmount}
                  keyboardType="numeric"
                />
                <Field
                  label="Notes"
                  value={jobNotes}
                  onChangeText={setJobNotes}
                />
                <Button label="Save job" onPress={submitJob} fullWidth />
              </>
            )}
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const c = useColors();
  return (
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
        {label}
      </Text>
      <Text
        style={{
          color,
          fontFamily: "Inter_700Bold",
          fontSize: 14,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cleanerHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  payToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
