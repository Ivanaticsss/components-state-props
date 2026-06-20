import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import CounterDisplay from '../../components/ui/CounterButton';

const { width: SW, height: SH } = Dimensions.get('window');
const scale  = (s: number) => Math.round((SW / 390) * s);
const vscale = (s: number) => Math.round((SH / 844) * s);

export default function Index() {
  const [count, setCount] = useState(100);

  const handleAdd   = () => setCount((prev) => prev + 1);
  const handleMinus = () => setCount((prev) => prev - 1);
  const handleReset = () => setCount(100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.parentWrapper}>
          {/* Accent bar at top, now a 4-tone sweep matching the gauge palette */}
          <View style={styles.accentBar}>
            <View style={[styles.swatch, { backgroundColor: '#22D3EE' }]} />
            <View style={[styles.swatch, { backgroundColor: '#3B82F6' }]} />
            <View style={[styles.swatch, { backgroundColor: '#A855F7' }]} />
            <View style={[styles.swatch, { backgroundColor: '#F43F5E' }]} />
          </View>

          {/* Badge */}
          <View style={styles.parentBadge}>
            <Text style={styles.parentBadgeText}>SPEED MANAGEMENT APP</Text>
          </View>

          <View style={styles.parentBody}>
            <Text style={styles.parentTitle}>MANAGE SPEED </Text>

            {/* State Locker, redesigned as a telemetry readout row */}
            <View style={styles.stateLocker}>
              <View style={styles.stateLockerHeader}>
                <Text style={styles.stateLockerLabel}>STATE LOCKER</Text>
                <View style={styles.statusDot} />
              </View>
              <View style={styles.stateLockerDivider} />
              <Text style={styles.stateLockerValue}>{count}</Text>
              <Text style={styles.stateLockerSub}>count (held in useState)</Text>
            </View>

            <CounterDisplay
              count={count}
              onAdd={handleAdd}
              onMinus={handleMinus}
              onReset={handleReset}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05070D',
  },
  scroll: {
    padding: scale(20),
    paddingBottom: vscale(40),
    alignItems: 'center',
    flexGrow: 1,
  },
  parentWrapper: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: scale(24),
    overflow: 'hidden',
    marginTop: vscale(16),
  },
  accentBar: {
    flexDirection: 'row',
    width: '40%',
    height: 3,
    alignSelf: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  swatch: { flex: 1 },
  parentBadge: {
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    borderRadius: scale(20),
    paddingHorizontal: scale(14),
    paddingVertical: vscale(5),
    marginTop: vscale(12),
  },
  parentBadgeText: {
    color: '#BFDBFE',
    fontWeight: '800',
    fontSize: scale(11),
    letterSpacing: 0.5,
  },
  parentBody: {
    backgroundColor: '#0B1220',
    padding: scale(18),
    paddingTop: vscale(14),
  },
  parentTitle: {
    fontSize: scale(20),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: vscale(14),
    color: '#F0F6FF',
    letterSpacing: 0.3,
  },
  stateLocker: {
    backgroundColor: '#0F172A',
    borderRadius: scale(14),
    paddingVertical: vscale(14),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  stateLockerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  stateLockerLabel: {
    color: '#60A5FA',
    fontSize: scale(10),
    fontWeight: '800',
    letterSpacing: 2,
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#22D3EE',
  },
  stateLockerDivider: {
    width: scale(32),
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.3)',
    marginVertical: vscale(6),
  },
  stateLockerValue: {
    color: '#fff',
    fontSize: scale(32),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stateLockerSub: {
    color: '#475569',
    fontSize: scale(10),
    fontWeight: '600',
    marginTop: vscale(3),
    letterSpacing: 0.3,
  },
});