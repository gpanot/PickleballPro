import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import {
  Layers,
  Users,
  Grid,
  TrendingUp,
  ChevronLeft,
  ArrowRight,
  X,
  FileText,
  CheckCircle,
  BarChart2,
  Home,
  MapPin,
  Trophy,
  MessageCircle,
  Mail,
  Share2,
  Copy,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: '#007AFF',
  indigo: '#6366F1',
  sky: '#0EA5E9',
  green: '#22C55E',
  surface: '#F8F9FA',
  border: '#E5E5E5',
  text: '#000000',
  textSub: '#666666',
  hint: '#999999',
  white: '#FFFFFF',
  tintBlue: '#E8F5FF',
  tintIndigo: '#F0EEFF',
  tintGreen: '#E8FFF0',
  tintSky: '#E8F8FF',
  dark: '#111111',
};

const CONFETTI_COLORS = [C.primary, C.indigo, C.sky, C.green, C.border];

// ─── AnimatedCircle for SVG pulse ─────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CHROME — screens 4-8
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ filledCount }) {
  return (
    <View style={pb.row}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[pb.seg, { backgroundColor: i < filledCount ? C.primary : C.border }]}
        />
      ))}
    </View>
  );
}
const pb = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 2 },
  seg: { flex: 1, height: 3, borderRadius: 2 },
});

function BackRow({ onBack }) {
  return (
    <TouchableOpacity
      onPress={onBack}
      style={br.wrap}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <ChevronLeft size={16} color="#666666" strokeWidth={2} />
      <Text style={br.label}>Back</Text>
    </TouchableOpacity>
  );
}
const br = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 2,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#666666' },
});

function PrimaryBtn({ label, onPress, disabled, loading }) {
  return (
    <TouchableOpacity
      style={[pbi.base, (disabled || loading) && pbi.disabled]}
      onPress={onPress}
      disabled={!!disabled || !!loading}
      activeOpacity={0.85}
    >
      <Text style={pbi.label}>{loading ? 'Creating…' : label}</Text>
    </TouchableOpacity>
  );
}
const pbi = StyleSheet.create({
  base: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

function GhostBtn({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={gb.base} activeOpacity={0.7}>
      <Text style={gb.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const gb = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
    marginTop: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: C.hint },
});

function SetupFooter({ children }) {
  return <View style={ft.wrap}>{children}</View>;
}
const ft = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});

function StepTag({ label }) {
  return <Text style={stag.text}>{label}</Text>;
}
const stag = StyleSheet.create({
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: C.hint,
    letterSpacing: 0.77,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTRO CHROME — screens 1-3 (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function ProgressDots({ total, active }) {
  return (
    <View style={dots.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dots.dot, i === active ? dots.activeDot : dots.inactiveDot]}
        />
      ))}
    </View>
  );
}
const dots = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  activeDot: { width: 20, backgroundColor: '#007AFF' },
  inactiveDot: { width: 6, backgroundColor: '#E5E5E5' },
});

function IntroButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[ib.base, disabled && ib.disabled]}
      onPress={onPress}
      disabled={!!disabled}
      activeOpacity={0.85}
    >
      <Text style={ib.label}>{label}</Text>
      <ArrowRight size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
const ib = StyleSheet.create({
  base: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

function IntroBottomBar({ dotsTotal, dotsActive, label, onPress }) {
  return (
    <View style={ibb.wrap}>
      <ProgressDots total={dotsTotal} active={dotsActive} />
      <View style={{ height: 16 }} />
      <IntroButton label={label} onPress={onPress} />
    </View>
  );
}
const ibb = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
});

function FeatureCard({ iconBg, icon, title, subtitle }) {
  return (
    <View style={fcard.wrap}>
      <View style={[fcard.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={fcard.textWrap}>
        <Text style={fcard.title}>{title}</Text>
        <Text style={fcard.sub}>{subtitle}</Text>
      </View>
    </View>
  );
}
const fcard = StyleSheet.create({
  wrap: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#000000', marginBottom: 2 },
  sub: { fontSize: 12, color: '#666666', lineHeight: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — You Built the Brand (intro, unchanged content)
// ─────────────────────────────────────────────────────────────────────────────

function Step0({ onContinue, onSkip, onClose }) {
  return (
    <View style={s.stepContainer}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroIconWrap}>
          <Layers size={28} color="#FFFFFF" />
        </View>

        <Text style={s.introTitle}>You Built the Brand.{'\n'}Now Build the Network.</Text>
        <Text style={s.introSubtitle}>
          Your coaching method, delivered by coaches in every city. One system. One brand. Unlimited reach.
        </Text>

        <View style={s.cardsWrap}>
          <FeatureCard
            iconBg="#E8F5FF"
            icon={<Users size={18} color="#007AFF" />}
            title="Affiliate coaches"
            subtitle="Coaches in new cities run your program"
          />
          <FeatureCard
            iconBg="#F0EEFF"
            icon={<Grid size={18} color="#6366F1" />}
            title="Your brand, everywhere"
            subtitle="Students join your academy, not random coaches"
          />
          <FeatureCard
            iconBg="#E8FFF0"
            icon={<TrendingUp size={18} color="#22C55E" />}
            title="Revenue beyond sessions"
            subtitle="Earn when your affiliate coaches teach"
          />
        </View>
      </ScrollView>

      <IntroBottomBar dotsTotal={3} dotsActive={0} label="Continue" onPress={onContinue} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2 — A Network That Runs Like Yours (intro, unchanged content)
// ─────────────────────────────────────────────────────────────────────────────

function Step1({ onContinue, onBack, onSkip }) {
  return (
    <View style={s.stepContainer}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={26} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.introStepLabel}>YOUR STRUCTURE</Text>
        <Text style={s.introTitle}>Your Academy, A Network That Runs Like Yours</Text>
        <Text style={s.introSubtitle}>
          A clear 3-tier model. You set the vision. Your coaches deliver it on the ground.
        </Text>

        <View style={tree.card}>
          <View style={tree.topRow}>
            <View style={[tree.topNode, { backgroundColor: '#007AFF' }]}>
              <Home size={14} color="rgba(255,255,255,0.9)" style={{ marginBottom: 4 }} />
              <Text style={tree.topLabel}>You (Academy Owner)</Text>
              <Text style={tree.topSub}>Vision, curriculum, brand</Text>
            </View>
          </View>

          <View style={tree.vLine} />

          <View style={tree.midSection}>
            <View style={tree.hLine} />
            <View style={tree.midNodesRow}>
              {['City A', 'City B', 'City C'].map((city) => (
                <View key={city} style={tree.midCol}>
                  <View style={tree.vLineMid} />
                  <View style={[tree.smallNode, { backgroundColor: '#6366F1' }]}>
                    <MapPin size={11} color="rgba(255,255,255,0.9)" style={{ marginBottom: 2 }} />
                    <Text style={tree.smallLabel}>{city}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={tree.midSection}>
            <View style={tree.hLine} />
            <View style={tree.midNodesRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={tree.midCol}>
                  <View style={tree.vLineMid} />
                  <View style={[tree.smallNode, { backgroundColor: '#0EA5E9' }]}>
                    <Users size={11} color="rgba(255,255,255,0.9)" style={{ marginBottom: 2 }} />
                    <Text style={tree.smallLabel}>Coach</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={tree.pillRow}>
            <View style={[tree.pill, { backgroundColor: '#E8F5FF' }]}>
              <Text style={[tree.pillText, { color: '#007AFF' }]}>Owner</Text>
            </View>
            <View style={[tree.pill, { backgroundColor: '#F0EEFF' }]}>
              <Text style={[tree.pillText, { color: '#6366F1' }]}>Regions</Text>
            </View>
            <View style={[tree.pill, { backgroundColor: '#E8F8FF' }]}>
              <Text style={[tree.pillText, { color: '#0EA5E9' }]}>Coaches</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <IntroBottomBar dotsTotal={3} dotsActive={1} label="Continue" onPress={onContinue} />
    </View>
  );
}

const tree = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  topRow: { alignItems: 'center', width: '100%' },
  topNode: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 180,
  },
  topLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  topSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },
  vLine: { width: 2, height: 14, backgroundColor: '#D1D5DB' },
  midSection: { alignItems: 'center', width: '100%' },
  hLine: { width: '70%', height: 2, backgroundColor: '#D1D5DB' },
  midNodesRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  midCol: { alignItems: 'center' },
  vLineMid: { width: 2, height: 10, backgroundColor: '#D1D5DB' },
  smallNode: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  smallLabel: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 14, justifyContent: 'center' },
  pill: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14 },
  pillText: { fontSize: 12, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — Build Once. Deliver Everywhere. (intro, unchanged content)
// ─────────────────────────────────────────────────────────────────────────────

function Step2({ onContinue, onBack, onSkip }) {
  const flowItems = [
    { color: '#007AFF', icon: <FileText size={18} color="#FFFFFF" />, title: 'You create the program', body: 'Drills, benchmarks, and skill levels. Set once.' },
    { color: '#6366F1', icon: <Users size={18} color="#FFFFFF" />, title: 'Coaches deliver it', body: 'Every affiliate coach follows the same structure, in any city.' },
    { color: '#0EA5E9', icon: <CheckCircle size={18} color="#FFFFFF" />, title: 'Students get assessed', body: 'Progress tracked with real data, not guesswork.' },
    { color: '#111111', icon: <BarChart2 size={18} color="#FFFFFF" />, title: 'You see everything', body: 'Performance dashboard across the whole network.' },
  ];

  return (
    <View style={s.stepContainer}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={26} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.introStepLabel}>THE SYSTEM</Text>
        <Text style={s.introTitle}>Build Once.{'\n'}Deliver Everywhere.</Text>
        <Text style={s.introSubtitle}>
          Your curriculum runs across your whole network. Every student follows the same path, every coach runs the same playbook.
        </Text>

        <View style={flowList.wrap}>
          {flowItems.map((item, idx) => (
            <View key={idx} style={flowList.row}>
              <View style={flowList.leftCol}>
                <View style={[flowList.circle, { backgroundColor: item.color }]}>{item.icon}</View>
                {idx < flowItems.length - 1 && <View style={flowList.line} />}
              </View>
              <View style={flowList.textCol}>
                <Text style={flowList.title}>{item.title}</Text>
                <Text style={flowList.body}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <IntroBottomBar dotsTotal={3} dotsActive={2} label="Start My Academy" onPress={onContinue} />
    </View>
  );
}

const flowList = StyleSheet.create({
  wrap: { marginBottom: 8 },
  row: { flexDirection: 'row', gap: 14 },
  leftCol: { alignItems: 'center', width: 42 },
  circle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  line: { width: 2, flex: 1, backgroundColor: '#E5E5E5', marginVertical: 4, minHeight: 16 },
  textCol: { flex: 1, paddingBottom: 20 },
  title: { fontSize: 14, fontWeight: '700', color: '#000000', marginBottom: 3, marginTop: 10 },
  body: { fontSize: 13, color: '#666666', lineHeight: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4 — Name Your Academy (step 1 of 3)
// ─────────────────────────────────────────────────────────────────────────────

function Step3({ name, setName, onContinue, onBack }) {
  const [focused, setFocused] = useState(false);
  const trimmed = name.trim();

  return (
    <View style={s.stepContainer}>
      <ProgressBar filledCount={1} />
      <BackRow onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.heroIconWrap, { backgroundColor: C.tintBlue }]}>
          <Home size={28} color={C.primary} />
        </View>

        <StepTag label="STEP 1 OF 3" />
        <Text style={s.setupTitle}>{'Name your\nacademy.'}</Text>
        <Text style={s.setupSubtitle}>
          This is your brand. Choose a name that reflects your coaching identity and the community you're building.
        </Text>

        <Text style={s.inputLabel}>
          Academy Name <Text style={{ color: C.primary }}>*</Text>
        </Text>
        <TextInput
          style={[s.textInput, focused && s.textInputFocused]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Johnson Pickleball Academy"
          placeholderTextColor="#BBBBBB"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={80}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
        <Text style={s.hintText}>You can always update this later in your academy settings.</Text>
      </ScrollView>

      <SetupFooter>
        <PrimaryBtn label="Continue" onPress={onContinue} disabled={!trimmed} />
      </SetupFooter>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 5 — Set Your Territory (step 2 of 3)
// ─────────────────────────────────────────────────────────────────────────────

const MAP_VB_W = 200;
const MAP_VB_H = 110;
// Simplified continental US silhouette
const US_PATH =
  'M 12,55 L 20,38 L 32,28 L 58,20 L 88,15 L 118,14 L 142,17 ' +
  'L 160,24 L 168,36 L 165,49 L 148,54 L 138,60 L 136,70 ' +
  'L 144,79 L 130,86 L 112,88 L 94,92 L 78,96 L 63,95 ' +
  'L 55,87 L 42,99 L 28,96 L 18,84 L 10,68 Z';
const HOME_DOT = { x: 22, y: 80, label: 'San Diego' };
const OPEN_DOTS = [
  { x: 96, y: 50, label: 'Denver' },
  { x: 120, y: 73, label: 'Dallas' },
  { x: 143, y: 44, label: 'Chicago' },
];

function MapCard() {
  const pulseOpacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseOpacity, { toValue: 0.15, duration: 1000, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseOpacity]);

  return (
    <View style={mapCard.wrap}>
      <Svg
        width="100%"
        height={180}
        viewBox={`0 0 ${MAP_VB_W} ${MAP_VB_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid texture */}
        {[20, 40, 60, 80].map((y) => (
          <Line key={`h${y}`} x1="0" y1={y} x2={MAP_VB_W} y2={y} stroke={C.border} strokeWidth="0.5" opacity="0.5" />
        ))}
        {[40, 80, 120, 160].map((x) => (
          <Line key={`v${x}`} x1={x} y1="0" x2={x} y2={MAP_VB_H} stroke={C.border} strokeWidth="0.5" opacity="0.5" />
        ))}

        {/* US silhouette */}
        <Path d={US_PATH} fill="#F0F0F0" stroke={C.border} strokeWidth="1" />

        {/* Dashed lines from home to open cities */}
        {OPEN_DOTS.map((city, i) => (
          <Line
            key={i}
            x1={HOME_DOT.x}
            y1={HOME_DOT.y}
            x2={city.x}
            y2={city.y}
            stroke={C.border}
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {/* Open city dots */}
        {OPEN_DOTS.map((city, i) => (
          <G key={i}>
            <Circle cx={city.x} cy={city.y} r="4" fill="#F0F0F0" stroke="#CCCCCC" strokeWidth="1.5" />
            <SvgText x={city.x} y={city.y + 11} fontSize="6" fontWeight="600" fill={C.hint} textAnchor="middle">
              {city.label}
            </SvgText>
          </G>
        ))}

        {/* Pulse ring */}
        <AnimatedCircle cx={HOME_DOT.x} cy={HOME_DOT.y} r="10" fill={C.primary} opacity={pulseOpacity} />

        {/* Home dot */}
        <Circle cx={HOME_DOT.x} cy={HOME_DOT.y} r="6" fill={C.primary} />

        {/* Home label */}
        <SvgText x={HOME_DOT.x} y={HOME_DOT.y + 14} fontSize="6.5" fontWeight="700" fill={C.primary} textAnchor="middle">
          {HOME_DOT.label}
        </SvgText>
      </Svg>

      {/* Legend strip */}
      <View style={mapCard.legend}>
        <View style={mapCard.legendItem}>
          <View style={[mapCard.dot, { backgroundColor: C.primary }]} />
          <Text style={mapCard.legendLabel}>You</Text>
        </View>
        <View style={mapCard.legendItem}>
          <View style={[mapCard.dot, { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#CCCCCC' }]} />
          <Text style={mapCard.legendLabel}>Open territory</Text>
        </View>
      </View>
    </View>
  );
}

const mapCard = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 0,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
    alignItems: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendLabel: { fontSize: 10, fontWeight: '600', color: C.hint },
});

function Step4({ homeCity, onContinue, onBack }) {
  return (
    <View style={s.stepContainer}>
      <ProgressBar filledCount={2} />
      <BackRow onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <StepTag label="STEP 2 OF 3" />
        <Text style={s.setupTitle}>{'Set your\nhome city.'}</Text>
        <Text style={s.setupSubtitle}>
          This is where you coach. Affiliated coaches will cover other cities.
        </Text>

        <MapCard />

        {/* Territory row */}
        <View style={terr.wrap}>
          <View style={{ flex: 1 }}>
            <Text style={terr.label}>YOUR CITY</Text>
            <View style={terr.valueRow}>
              <Text style={terr.value}>{homeCity.city}, {homeCity.region}</Text>
              <View style={terr.homeBadge}>
                <Text style={terr.homeBadgeText}>HOME</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'City selection will be available in a future update.')}>
            <Text style={terr.change}>Change</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SetupFooter>
        <PrimaryBtn label="This is my territory" onPress={onContinue} />
      </SetupFooter>
    </View>
  );
}

const terr = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: C.hint,
    textTransform: 'uppercase',
    letterSpacing: 0.66,
    marginBottom: 4,
  },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 16, fontWeight: '800', color: C.text },
  homeBadge: {
    backgroundColor: C.primary,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  homeBadgeText: { fontSize: 10, fontWeight: '700', color: C.white },
  change: { fontSize: 13, fontWeight: '700', color: C.primary },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 6 — Set Your Royalty Rate (step 3 of 3)
// ─────────────────────────────────────────────────────────────────────────────

const RATE_OPTIONS = [
  {
    rate: 7,
    description: 'Lower cut, easier to recruit. Good if you want fast growth and are building your first cohort.',
    math: '3 coaches x $4K avg = $840/mo',
    recommended: false,
  },
  {
    rate: 10,
    description: 'The standard. Coaches expect it. Still a fraction of what a traditional franchise charges.',
    math: '3 coaches x $4K avg = $1,200/mo',
    recommended: true,
  },
  {
    rate: 15,
    description: 'Premium tier. Best once your brand has reach and you can prove lead flow to incoming coaches.',
    math: '3 coaches x $4K avg = $1,800/mo',
    recommended: false,
  },
];

function RateCard({ option, selected, onSelect }) {
  return (
    <TouchableOpacity
      style={[rc.wrap, selected && rc.selected]}
      onPress={() => onSelect(option.rate)}
      activeOpacity={0.8}
    >
      {option.recommended && (
        <View style={rc.badge}>
          <Text style={rc.badgeText}>RECOMMENDED</Text>
        </View>
      )}
      <View style={rc.topRow}>
        <Text style={rc.pct}>{option.rate}%</Text>
        <View style={[rc.radio, selected && rc.radioSelected]}>
          {selected && <View style={rc.radioFill} />}
        </View>
      </View>
      <Text style={rc.desc}>{option.description}</Text>
      <Text style={rc.math}>{option.math}</Text>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 18,
    backgroundColor: C.white,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  selected: {
    borderColor: C.primary,
    backgroundColor: '#F0F7FF',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: C.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 0.63 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pct: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.primary, backgroundColor: C.primary },
  radioFill: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  desc: { fontSize: 13, color: C.textSub, lineHeight: 13 * 1.4, marginBottom: 8 },
  math: { fontSize: 12, fontWeight: '700', color: C.primary },
});

function Step5({ royaltyRate, setRoyaltyRate, onLaunch, loading, onBack }) {
  return (
    <View style={s.stepContainer}>
      <ProgressBar filledCount={3} />
      <BackRow onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <StepTag label="STEP 3 OF 3" />
        <Text style={s.setupTitle}>{'Set your\nroyalty rate.'}</Text>
        <Text style={s.setupSubtitle}>
          Every coach in your academy pays you this percentage. You can update it anytime.
        </Text>

        {RATE_OPTIONS.map((opt) => (
          <RateCard
            key={opt.rate}
            option={opt}
            selected={royaltyRate === opt.rate}
            onSelect={setRoyaltyRate}
          />
        ))}

        <Text style={s.hintText}>You can update this at any time in academy settings.</Text>
      </ScrollView>

      <SetupFooter>
        <PrimaryBtn label="Launch my academy" onPress={onLaunch} loading={loading} />
      </SetupFooter>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 7 — Academy is Live (congrats, confetti)
// ─────────────────────────────────────────────────────────────────────────────

function Step6({ name, royaltyRate, homeCity, onInvite, onSkip }) {
  const particles = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      anim: new Animated.Value(0),
      x: (i / 24) * SCREEN_W,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + (i % 6),
      delay: (i * 21) % 500,
      isSquare: i % 2 === 0,
      duration: 2000 + (i * 62) % 1500,
      rotateEnd: `${i % 2 === 0 ? '' : '-'}${360 + (i * 11) % 240}deg`,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      p.anim.setValue(0);
      Animated.timing(p.anim, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        useNativeDriver: true,
      }).start();
    });
  }, [particles]);

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      {/* Confetti layer */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size,
            borderRadius: p.isSquare ? 2 : p.size / 2,
            backgroundColor: p.color,
            zIndex: 10,
            transform: [
              {
                translateY: p.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_H + 50],
                }),
              },
              {
                rotate: p.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', p.rotateEnd],
                }),
              },
            ],
            opacity: p.anim.interpolate({
              inputRange: [0, 0.75, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      ))}

      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={cong.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy hero */}
        <View style={cong.trophyOuter}>
          <View style={cong.ring1} />
          <View style={cong.ring2} />
          <View style={cong.trophyBox}>
            <Trophy size={34} color="#FFFFFF" strokeWidth={1.8} />
          </View>
        </View>

        <Text style={cong.eyebrow}>YOUR ACADEMY IS LIVE</Text>
        <Text style={cong.welcome}>Welcome to</Text>
        <Text style={cong.academyName}>{name || 'Your Academy'}</Text>
        <Text style={cong.sub}>
          Every coach you bring in generates royalty income without you teaching a single extra session.
        </Text>

        {/* Stats row */}
        <View style={cong.statsRow}>
          {[
            { value: `${royaltyRate}%`, label: 'Royalty rate' },
            { value: homeCity.short, label: 'Home base' },
            { value: '$0', label: 'Royalties/mo' },
          ].map((stat, i) => (
            <View
              key={i}
              style={[cong.statCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: C.border }]}
            >
              <Text style={cong.statValue}>{stat.value}</Text>
              <Text style={cong.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <SetupFooter>
        <PrimaryBtn label="Invite my first coach" onPress={onInvite} />
        <GhostBtn label="Skip for now" onPress={onSkip} />
      </SetupFooter>
    </View>
  );
}

const cong = StyleSheet.create({
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 140,
  },
  trophyOuter: { width: 80, height: 80, position: 'relative', marginBottom: 24 },
  ring1: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,122,255,0.15)',
  },
  ring2: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,122,255,0.1)',
  },
  trophyBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: C.hint,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  academyName: {
    fontSize: 28,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.4,
    marginBottom: 16,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 14 * 1.6,
    textAlign: 'center',
    maxWidth: 270,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    width: '100%',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 17, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: C.hint, marginTop: 3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 8 — Invite Your First Affiliated Coach
// ─────────────────────────────────────────────────────────────────────────────

function Step7({ name, royaltyRate, inviteToken, inviteLoading, onDone, onBack }) {
  const keepPct = 100 - royaltyRate;
  const displayLink = inviteToken || 'academypro://invite/…';

  const handleShare = async () => {
    if (!inviteToken) return;
    try {
      await Share.share({ message: inviteToken });
    } catch (_) {}
  };

  const handleCopy = async () => {
    try {
      await Share.share({ message: inviteToken || '' });
    } catch (_) {}
  };

  const SHARE_BTNS = [
    { label: 'Message', icon: <MessageCircle size={16} color={C.primary} />, bg: C.tintBlue, onPress: handleShare },
    { label: 'Email', icon: <Mail size={16} color={C.sky} />, bg: C.tintSky, onPress: handleShare },
    { label: 'Share', icon: <Share2 size={16} color={C.green} />, bg: C.tintGreen, onPress: handleShare },
  ];

  return (
    <View style={s.stepContainer}>
      <ProgressBar filledCount={3} />
      <BackRow onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.setupTitle}>{'Invite your first\naffiliated coach.'}</Text>
        <Text style={s.setupSubtitle}>
          When they join, you start earning royalties from every student they coach.
        </Text>

        {/* Invite link block */}
        <View style={inv.linkBlock}>
          <View style={{ padding: 16 }}>
            <Text style={inv.linkLabel}>YOUR INVITE LINK</Text>
            <Text style={inv.linkUrl} numberOfLines={2}>
              {displayLink}
            </Text>
          </View>
          <TouchableOpacity style={inv.copyStrip} onPress={handleCopy} activeOpacity={0.7}>
            <Copy size={14} color={C.primary} />
            <Text style={inv.copyLabel}>Copy link</Text>
          </TouchableOpacity>
        </View>

        {/* Share row */}
        <View style={inv.shareRow}>
          {SHARE_BTNS.map((btn) => (
            <TouchableOpacity key={btn.label} style={inv.shareBtn} onPress={btn.onPress} activeOpacity={0.75}>
              <View style={[inv.shareIconWrap, { backgroundColor: btn.bg }]}>{btn.icon}</View>
              <Text style={inv.shareBtnLabel}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview card */}
        <Text style={inv.sectionLabel}>WHAT THEY SEE</Text>
        <View style={inv.previewCard}>
          {/* Header */}
          <View style={inv.previewHeader}>
            <View style={inv.previewLogo}>
              <Home size={14} color={C.white} strokeWidth={2} />
            </View>
            <View>
              <Text style={inv.previewName}>{name || 'Your Academy'}</Text>
              <Text style={inv.previewTagline}>{"You've been invited to join"}</Text>
            </View>
          </View>

          {/* Body */}
          <View style={inv.previewBody}>
            <Text style={inv.previewMsg}>
              {`Run a proven curriculum under an established brand. You keep ${keepPct}% of everything you earn.`}
            </Text>
            <View style={inv.earningsBox}>
              <Text style={inv.earningsLabel}>YOUR ESTIMATED TAKE-HOME</Text>
              <Text style={inv.earningsValue}>$4,050/month</Text>
              <Text style={inv.earningsSub}>at 15 students · $300/mo each</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SetupFooter>
        <PrimaryBtn label="Go to my academy" onPress={onDone} />
        <GhostBtn label="Skip for now" onPress={onDone} />
      </SetupFooter>
    </View>
  );
}

const inv = StyleSheet.create({
  linkBlock: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.hint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  linkUrl: { fontSize: 13, fontWeight: '600', color: C.indigo, lineHeight: 13 * 1.4 },
  copyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  copyLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  shareRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  shareBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 5,
  },
  shareIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  shareBtnLabel: { fontSize: 11, fontWeight: '600', color: C.textSub },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.hint,
    textTransform: 'uppercase',
    letterSpacing: 0.66,
    marginBottom: 8,
  },
  previewCard: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewHeader: {
    backgroundColor: C.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: 13, fontWeight: '800', color: C.white },
  previewTagline: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  previewBody: { backgroundColor: C.surface, padding: 14 },
  previewMsg: { fontSize: 13, color: '#333333', lineHeight: 13 * 1.5, marginBottom: 10 },
  earningsBox: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.hint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsValue: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginTop: 3 },
  earningsSub: { fontSize: 11, color: C.hint, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AcademyOnboardingFlow({ visible, onCreate, onDismiss }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [royaltyRate, setRoyaltyRate] = useState(10);
  const [creating, setCreating] = useState(false);
  const [academyId, setAcademyId] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const homeCity = { city: 'San Diego', region: 'CA', short: 'SD, CA' };

  // Pre-generate invite token as soon as we land on the congrats screen
  useEffect(() => {
    if (step === 6 && academyId && !inviteToken && !inviteLoading) {
      setInviteLoading(true);
      supabase.auth.getUser().then(({ data }) => {
        const userId = data?.user?.id;
        return supabase
          .from('academy_invites')
          .insert({ academy_id: academyId, role: 'coach', created_by: userId })
          .select('token')
          .single();
      }).then(({ data, error }) => {
        if (!error && data?.token) {
          setInviteToken(`academypro://invite/${data.token}`);
        }
      }).catch(() => {}).finally(() => setInviteLoading(false));
    }
  }, [step, academyId, inviteToken, inviteLoading]);

  const handleLaunch = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const result = await onCreate({ name: name.trim(), royaltyRate });
      setAcademyId(result?.academyId ?? null);
      setStep(6);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to create your academy. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setStep(0);
    setName('');
    setRoyaltyRate(10);
    setCreating(false);
    setAcademyId(null);
    setInviteToken(null);
    setInviteLoading(false);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
        {step === 0 && (
          <Step0
            onContinue={() => setStep(1)}
            onSkip={() => setStep(1)}
            onClose={handleDismiss}
          />
        )}
        {step === 1 && (
          <Step1
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            name={name}
            setName={setName}
            onContinue={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4
            homeCity={homeCity}
            onContinue={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5
            royaltyRate={royaltyRate}
            setRoyaltyRate={setRoyaltyRate}
            onLaunch={handleLaunch}
            loading={creating}
            onBack={() => setStep(4)}
          />
        )}
        {step === 6 && (
          <Step6
            name={name}
            royaltyRate={royaltyRate}
            homeCity={homeCity}
            onInvite={() => setStep(7)}
            onSkip={() => setStep(7)}
          />
        )}
        {step === 7 && (
          <Step7
            name={name}
            royaltyRate={royaltyRate}
            inviteToken={inviteToken}
            inviteLoading={inviteLoading}
            onDone={handleDismiss}
            onBack={() => setStep(6)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepContainer: { flex: 1, backgroundColor: C.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 8,
  },
  skipText: { fontSize: 15, fontWeight: '600', color: C.primary },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardsWrap: { marginBottom: 8 },
  // Intro screens
  introTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 12,
  },
  introSubtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
  },
  introStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  // Setup screens (4-8)
  setupTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.6,
    lineHeight: 36 * 1.1,
    marginBottom: 12,
  },
  setupSubtitle: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 14 * 1.5,
    marginBottom: 20,
  },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.white,
    marginBottom: 8,
  },
  textInputFocused: { borderColor: C.primary },
  hintText: { fontSize: 12, color: C.hint, lineHeight: 17, marginBottom: 24 },
});
