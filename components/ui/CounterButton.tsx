import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

// NOTE: this component now uses react-native-svg for the gauge arc.
// If it isn't already in your project, install it with:
//   npx expo install react-native-svg

const { width: SW, height: SH } = Dimensions.get('window');
const scale  = (s: number) => Math.round((SW / 390) * s);
const vscale = (s: number) => Math.round((SH / 844) * s);

interface CounterDisplayProps {
  count: number;
  onAdd: () => void;
  onMinus: () => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Gauge geometry
// ---------------------------------------------------------------------------
const GAUGE_MIN = -50;
const GAUGE_MAX = 250;
const START_ANGLE = -135; // degrees, measured clockwise from 12 o'clock
const END_ANGLE = 135;
const SWEEP = END_ANGLE - START_ANGLE; // 270deg dial, classic speedometer gap at bottom

const SIZE = scale(280);
const CENTER = SIZE / 2;
const RADIUS = CENTER - scale(28);
const STROKE = scale(16);
const NEEDLE_LENGTH = RADIUS - scale(16);

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function valueToAngle(value: number) {
  const clamped = clamp(value, GAUGE_MIN, GAUGE_MAX);
  const frac = (clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
  return START_ANGLE + frac * SWEEP;
}

function getZone(value: number) {
  const clamped = clamp(value, GAUGE_MIN, GAUGE_MAX);
  const frac = (clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
  if (frac < 0.33) return { label: 'LOW', color: '#22D3EE' };
  if (frac < 0.66) return { label: 'OPTIMAL', color: '#3B82F6' };
  return { label: 'HIGH', color: '#F43F5E' };
}

const TICK_ANGLES = [START_ANGLE, START_ANGLE + SWEEP / 2, END_ANGLE];
const TICK_VALUES = [GAUGE_MIN, Math.round((GAUGE_MIN + GAUGE_MAX) / 2), GAUGE_MAX];

// ---------------------------------------------------------------------------
// Live pulsing indicator, like a real-time monitor
// ---------------------------------------------------------------------------
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Gauge
// ---------------------------------------------------------------------------
function Gauge({ count }: { count: number }) {
  const needleAnim = useRef(new Animated.Value(valueToAngle(count))).current;

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: valueToAngle(count),
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [count]);

  const needleRotate = needleAnim.interpolate({
    inputRange: [START_ANGLE - 1, END_ANGLE + 1],
    outputRange: [`${START_ANGLE - 1}deg`, `${END_ANGLE + 1}deg`],
  });

  const trackPath = describeArc(CENTER, CENTER, RADIUS, START_ANGLE, END_ANGLE);
  const valuePath = describeArc(CENTER, CENTER, RADIUS, START_ANGLE, valueToAngle(count));
  const zone = getZone(count);

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#22D3EE" />
            <Stop offset="40%" stopColor="#3B82F6" />
            <Stop offset="70%" stopColor="#A855F7" />
            <Stop offset="100%" stopColor="#F43F5E" />
          </LinearGradient>
        </Defs>

        <Path d={trackPath} stroke="#1B2436" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        <Path d={valuePath} stroke="url(#gaugeGradient)" strokeWidth={STROKE} strokeLinecap="round" fill="none" />

        {TICK_ANGLES.map((angle, i) => {
          const inner = polarToCartesian(CENTER, CENTER, RADIUS - STROKE / 2 - scale(5), angle);
          const outer = polarToCartesian(CENTER, CENTER, RADIUS + STROKE / 2 + scale(5), angle);
          const labelPos = polarToCartesian(CENTER, CENTER, RADIUS + STROKE / 2 + scale(18), angle);
          return (
            <React.Fragment key={angle}>
              <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#334155" strokeWidth={2} />
              <SvgText
                x={labelPos.x}
                y={labelPos.y}
                fill="#64748B"
                fontSize={scale(10)}
                fontWeight="700"
                textAnchor="middle"
              >
                {TICK_VALUES[i]}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Circle cx={CENTER} cy={CENTER} r={scale(7)} fill="#0B1220" stroke="#3B82F6" strokeWidth={2} />
      </Svg>

      <Animated.View
        style={[styles.needle, { transform: [{ rotate: needleRotate }] }]}
        pointerEvents="none"
      />

      <View style={styles.readout} pointerEvents="none">
        <Text style={styles.readoutValue}>{count}</Text>
        <View style={[styles.zonePill, { borderColor: zone.color }]}>
          <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
          <Text style={[styles.zoneText, { color: zone.color }]}>{zone.label}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Control button (minus / primary add / reset) with press-and-hold repeat
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost';

function ControlButton({
  icon,
  label,
  onPress,
  onLongPressAction,
  variant,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  onLongPressAction?: () => void;
  variant: Variant;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressScale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  useEffect(() => {
    if (!isPrimary) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isPrimary]);

  const startContinuous = () => {
    if (!onLongPressAction) return;
    onLongPressAction();
    intervalRef.current = setInterval(() => onLongPressAction(), 80);
  };

  const stopContinuous = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    stopContinuous();
  };

  return (
    <View style={styles.ctrlSlot}>
      <Animated.View style={{ transform: [{ scale: Animated.multiply(pressScale, isPrimary ? pulse : 1) }] }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={startContinuous}
          delayLongPress={300}
          style={[
            styles.ctrlButton,
            isPrimary && styles.ctrlPrimary,
            isSecondary && styles.ctrlSecondary,
            !isPrimary && !isSecondary && styles.ctrlGhost,
          ]}
        >
          <Text style={[styles.ctrlIcon, isPrimary && styles.ctrlIconPrimary]}>{icon}</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.ctrlLabel, isPrimary && styles.ctrlLabelPrimary]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export — keeps the same props contract as before
// ---------------------------------------------------------------------------
export default function CounterDisplay({ count, onAdd, onMinus, onReset }: CounterDisplayProps) {
  return (
    <View style={styles.childWrapper}>
      <View style={styles.accentBar}>
        <View style={[styles.swatch, { backgroundColor: '#22D3EE' }]} />
        <View style={[styles.swatch, { backgroundColor: '#3B82F6' }]} />
        <View style={[styles.swatch, { backgroundColor: '#A855F7' }]} />
        <View style={[styles.swatch, { backgroundColor: '#F43F5E' }]} />
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.childBadge}>
          <Text style={styles.childBadgeText}>NOW TESTING</Text>
        </View>
        <LiveDot />
      </View>

      <View style={styles.childBody}>
        <Text style={styles.childTitle}>SPEED</Text>

        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <Text style={styles.propsLabel}>⬇  SPEED DECREASE</Text>
          <View style={styles.arrowLine} />
        </View>
        <View style={styles.connector} />

        <Gauge count={count} />

        <View style={styles.connector} />
        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <Text style={styles.propsLabel}>⬆  SPEED INCREASE</Text>
          <View style={styles.arrowLine} />
        </View>

        <View style={styles.divider} />

        <View style={styles.controlRow}>
          <ControlButton icon="－" label="Minus" onPress={onMinus} onLongPressAction={onMinus} variant="secondary" />
          <ControlButton icon="＋" label="Add" onPress={onAdd} onLongPressAction={onAdd} variant="primary" />
          <ControlButton icon="↺" label="Reset" onPress={onReset} variant="ghost" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  childWrapper: {
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    borderRadius: scale(20),
    marginTop: vscale(20),
    overflow: 'hidden',
    backgroundColor: '#070C16',
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vscale(10),
    gap: scale(8),
  },
  childBadge: {
    backgroundColor: '#1D4ED8',
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    paddingVertical: vscale(5),
  },
  childBadgeText: {
    color: '#BFDBFE',
    fontWeight: '700',
    fontSize: scale(10),
    letterSpacing: 0.3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22D3EE',
    borderRadius: scale(20),
    paddingHorizontal: scale(8),
    paddingVertical: vscale(4),
    gap: scale(4),
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#22D3EE',
  },
  liveText: {
    color: '#22D3EE',
    fontSize: scale(9),
    fontWeight: '800',
    letterSpacing: 1,
  },
  childBody: {
    backgroundColor: '#0D1A2E',
    padding: scale(18),
    paddingTop: vscale(14),
    alignItems: 'center',
  },
  childTitle: {
    fontSize: scale(13),
    color: '#475569',
    marginBottom: vscale(14),
    letterSpacing: 0.3,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    width: '100%',
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E3A5F',
  },
  propsLabel: {
    fontSize: scale(9),
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  connector: {
    width: 2,
    height: vscale(22),
    backgroundColor: '#2563EB',
    marginVertical: vscale(3),
    borderRadius: 2,
    opacity: 0.5,
  },

  // Gauge
  gaugeWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vscale(4),
  },
  needle: {
    position: 'absolute',
    left: CENTER - scale(2),
    top: CENTER - NEEDLE_LENGTH,
    width: scale(4),
    height: NEEDLE_LENGTH,
    backgroundColor: '#E0F2FE',
    borderRadius: scale(2),
    // @ts-ignore - transformOrigin is supported on RN 0.71+ / Expo SDK 49+
    transformOrigin: '50% 100%',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  readout: {
    position: 'absolute',
    top: CENTER + scale(26),
    alignItems: 'center',
    width: '100%',
  },
  readoutValue: {
    fontSize: scale(54),
    fontWeight: '900',
    color: '#E0F2FE',
    letterSpacing: -2,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(20),
    paddingHorizontal: scale(10),
    paddingVertical: vscale(2),
    marginTop: vscale(6),
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  zoneDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(5),
  },
  zoneText: {
    fontSize: scale(10),
    fontWeight: '800',
    letterSpacing: 1,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: vscale(14),
  },

  // Controls
  controlRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: scale(18),
    width: '100%',
  },
  ctrlSlot: {
    alignItems: 'center',
  },
  ctrlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  ctrlSecondary: {
    width: scale(58),
    height: scale(58),
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  ctrlGhost: {
    width: scale(58),
    height: scale(58),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  ctrlPrimary: {
    width: scale(88),
    height: scale(88),
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#60A5FA',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  ctrlIcon: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: scale(20),
    fontWeight: '700',
  },
  ctrlIconPrimary: {
    fontSize: scale(30),
    color: '#fff',
  },
  ctrlLabel: {
    marginTop: vscale(6),
    color: '#64748B',
    fontSize: scale(10),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  ctrlLabelPrimary: {
    color: '#93C5FD',
  },
});