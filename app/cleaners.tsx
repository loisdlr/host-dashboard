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
    updateCleaner,
    deleteCleaner,
    addJob,
    updateJob,
    deleteJob,
    settings,
  } = useRental();

  const [tab, setTab] = useState<"cleaners" | "jobs">("cleaners");
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  // Cleaner form state
  const [editingCleanerId, setEditingCleanerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState(String(settings.cleaningFee));

  // Job form state
  const [jobUnitId, setJobUnitId] = useState(units[0]?.id ?? "");
  const [jobCleanerId, setJobCleanerId] = useState(cleaners[0]?.id ?? "");
  const [jobDate, setJobDate] = useState(todayISO());
  const [jobAmount, setJobAmount] = useState(String(settings.cleaningFee));
  const [jobNotes, setJobNotes] = useState("");

  const summary = useMemo(() => {
    return cleaners.map((cl) => {
      const cJobs = jobs.filter((j) => j.cleanerId === cl.id);
      const paid = cJobs.filter((j) => j.paid).reduce((s, j) => s + j.amount, 0);
      const unpaid = cJobs.filter((j) => !j.paid).reduce((s, j) => s + j.amount, 0);
      return { cleaner: cl, paid, unpaid, count: cJobs.length };
    });
  }, [cleaners, jobs]);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => b.date.localeCompare(a.date)),
    [jobs]
  );

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";
  const cleanerName = (id: string) => cleaners.find((cl) => cl.id === id)?.name ?? "—";

  // --- CLEANER ACTIONS ---

  const handleEditCleaner = (cleaner: any) => {
    setEditingCleanerId(cleaner.id);
    setName(cleaner.name);
    setPhone(cleaner.phone || "");
    setRate(String(cleaner.ratePerClean));
    setShowAddCleaner(true);
  };

  const closeCleanerModal = () => {
    setShowAddCleaner(false);
    setEditingCleanerId(null);
    setName("");
    setPhone("");
    setRate(String(settings.cleaningFee));
  };

  const submitCleaner = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a cleaner name.");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      ratePerClean: Number(rate) || settings.cleaningFee,
    };

    if (editingCleanerId) {
      updateCleaner(editingCleanerId, payload);
    } else {
      addCleaner(payload);
    }
    closeCleanerModal();
  };

  const handleDeleteCleaner = (id: string, name: string) => {
    Alert.alert("Delete Cleaner", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => deleteCleaner(id) 
      },
    ]);
  };

  // --- JOB ACTIONS ---

  const submitJob = () => {
    if (!jobUnitId || !jobCleanerId) {
      Alert.alert("Error", "Pick a unit and a cleaner.");
      return;
    }
    addJob({
      unitId: jobUnitId,
      cleanerId: jobCleanerId,
      date: jobDate,
      amount: Number(jobAmount) || 0,
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
        onRightPress={() => (tab === "cleaners" ? setShowAddCleaner(true) : setShowAddJob(true))}
      />

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <SegmentedControl
          options={[
            { value: "cleaners", label: "Cleaners" },
            { value: "jobs", label: "Jobs" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 12 }}>
        {tab === "cleaners" ? (
          summary.length === 0 ? (
            <EmptyState icon="users" title="No cleaners" action={<Button label="Add" onPress={() => setShowAddCleaner(true)} />} />
          ) : (
            summary.map(({ cleaner, paid, unpaid, count }) => (
              <Card key={cleaner.id}>
                <View style={styles.cleanerHead}>
                  <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                    <Text style={{ color: c.primary, fontFamily: "Inter_700Bold" }}>
                      {cleaner.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>{cleaner.name}</Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{cleaner.phone || "No phone"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable onPress={() => handleEditCleaner(cleaner)}>
                      <Feather name="edit-2" size={18} color={c.mutedForeground} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteCleaner(cleaner.id, cleaner.name)}>
                      <Feather name="trash-2" size={18} color={c.error || "#ef4444"} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.statsContainer}>
                  <Stat label="Jobs" value={String(count)} color={c.foreground} />
                  <Stat label="Paid" value={formatMoney(paid, settings.currency)} color={c.success} />
                  <Stat label="Unpaid" value={formatMoney(unpaid, settings.currency)} color={unpaid > 0 ? c.warning : c.mutedForeground} />
                </View>
              </Card>
            ))
          )
        ) : (
          sortedJobs.map((j) => (
            <Card key={j.id}>
              <View style={styles.jobRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>{cleanerName(j.cleanerId)}</Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{unitName(j.unitId)} • {formatLong(j.date)}</Text>
                </View>
                <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>{formatMoney(j.amount, settings.currency)}</Text>
              </View>
              <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center", gap: 10 }}>
                <Pressable
                  onPress={() => updateJob(j.id, { paid: !j.paid })}
                  style={[styles.payToggle, { backgroundColor: j.paid ? c.success : c.muted }]}
                >
                  <Feather name={j.paid ? "check-circle" : "circle"} size={14} color={j.paid ? "white" : c.foreground} />
                  <Text style={{ color: j.paid ? "white" : c.foreground, fontSize: 12, marginLeft: 6 }}>{j.paid ? "Paid" : "Mark Paid"}</Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => deleteJob(j.id)}>
                  <Feather name="trash-2" size={16} color={c.mutedForeground} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Cleaner Modal */}
      <Modal visible={showAddCleaner} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeCleanerModal}>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader title={editingCleanerId ? "Edit Cleaner" : "Add Cleaner"} leftIcon="x" onLeftPress={closeCleanerModal} />
          <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, gap: 16 }}>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Rate per Clean" value={rate} onChangeText={setRate} keyboardType="numeric" />
            <Button label={editingCleanerId ? "Update" : "Save"} onPress={submitCleaner} fullWidth />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      {/* Job Modal */}
      <Modal visible={showAddJob} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddJob(false)}>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader title="Add Job" leftIcon="x" onLeftPress={() => setShowAddJob(false)} />
          <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, gap: 16 }}>
            <Picker label="Cleaner" value={jobCleanerId} options={cleaners.map(cl => ({ label: cl.name, value: cl.id }))} onChange={setJobCleanerId} />
            <Picker label="Unit" value={jobUnitId} options={units.map(u => ({ label: u.name, value: u.id }))} onChange={setJobUnitId} />
            <DateInput label="Date" value={jobDate} onChange={setJobDate} />
            <Field label="Amount" value={jobAmount} onChangeText={setJobAmount} keyboardType="numeric" />
            <Field label="Notes" value={jobNotes} onChangeText={setJobNotes} />
            <Button label="Save Job" onPress={submitJob} fullWidth />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#6B7280", fontSize: 10, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color, fontFamily: "Inter_700Bold", fontSize: 14 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cleanerHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  statsContainer: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  jobRow: { flexDirection: "row", alignItems: "center" },
  payToggle: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
});