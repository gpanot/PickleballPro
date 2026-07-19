import React, { useState } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';

// ─── Progress Dots ────────────────────────────────────────────────────────────
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  activeDot: { width: 20, backgroundColor: '#007AFF' },
  inactiveDot: { width: 6, backgroundColor: '#E5E5E5' },
});

// ─── Primary Button ───────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[btn.base, disabled && btn.disabled]}
      onPress={onPress}
      disabled={!!disabled}
      activeOpacity={0.85}
    >
      <Text style={btn.label}>{label}</Text>
      <ArrowRight size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
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

// ─── Fixed Bottom Bar (dots + CTA) ───────────────────────────────────────────
function BottomBar({ dotsTotal, dotsActive, label, onPress, disabled }) {
  return (
    <View style={bottom.wrap}>
      <ProgressDots total={dotsTotal} active={dotsActive} />
      <View style={{ height: 16 }} />
      <PrimaryButton label={label} onPress={onPress} disabled={disabled} />
    </View>
  );
}

const bottom = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
});

// ─── Step 0: You Built the Brand ─────────────────────────────────────────────
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

        <Text style={s.title}>You Built the Brand.{'\n'}Now Build the Network.</Text>

        <Text style={s.subtitle}>
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

      <BottomBar dotsTotal={3} dotsActive={0} label="Continue" onPress={onContinue} />
    </View>
  );
}

function FeatureCard({ iconBg, icon, title, subtitle }) {
  return (
    <View style={card.wrap}>
      <View style={[card.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={card.textWrap}>
        <Text style={card.title}>{title}</Text>
        <Text style={card.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
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
  subtitle: { fontSize: 12, color: '#666666', lineHeight: 16 },
});

// ─── Step 1: A Network That Runs Like Yours ───────────────────────────────────
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
        <Text style={s.stepLabel}>YOUR STRUCTURE</Text>
        <Text style={s.title}>Your Academy, A Network That Runs Like Yours</Text>
        <Text style={s.subtitle}>
          A clear 3-tier model. You set the vision. Your coaches deliver it on the ground.
        </Text>

        {/* Org tree card */}
        <View style={tree.card}>
          {/* Top node — owner */}
          <View style={tree.topRow}>
            <View style={[tree.topNode, { backgroundColor: '#007AFF' }]}>
              <Home size={14} color="rgba(255,255,255,0.9)" style={{ marginBottom: 4 }} />
              <Text style={tree.topLabel}>You (Academy Owner)</Text>
              <Text style={tree.topSub}>Vision, curriculum, brand</Text>
            </View>
          </View>

          {/* Vertical connector */}
          <View style={tree.vLine} />

          {/* Horizontal bar + 3 vertical drops */}
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

          {/* Bottom section */}
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

          {/* Legend pills */}
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

      <BottomBar dotsTotal={3} dotsActive={1} label="Continue" onPress={onContinue} />
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
  topRow: {
    alignItems: 'center',
    width: '100%',
  },
  topNode: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 180,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  topSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  vLine: {
    width: 2,
    height: 14,
    backgroundColor: '#D1D5DB',
  },
  midSection: {
    alignItems: 'center',
    width: '100%',
  },
  hLine: {
    width: '70%',
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  midNodesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  midCol: {
    alignItems: 'center',
  },
  vLineMid: {
    width: 2,
    height: 10,
    backgroundColor: '#D1D5DB',
  },
  smallNode: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});

// ─── Step 2: Build Once. Deliver Everywhere. ──────────────────────────────────
function Step2({ onContinue, onBack, onSkip }) {
  const flowSteps = [
    {
      color: '#007AFF',
      icon: <FileText size={18} color="#FFFFFF" />,
      title: 'You create the program',
      body: 'Drills, benchmarks, and skill levels. Set once.',
    },
    {
      color: '#6366F1',
      icon: <Users size={18} color="#FFFFFF" />,
      title: 'Coaches deliver it',
      body: 'Every affiliate coach follows the same structure, in any city.',
    },
    {
      color: '#0EA5E9',
      icon: <CheckCircle size={18} color="#FFFFFF" />,
      title: 'Students get assessed',
      body: 'Progress tracked with real data, not guesswork.',
    },
    {
      color: '#111111',
      icon: <BarChart2 size={18} color="#FFFFFF" />,
      title: 'You see everything',
      body: 'Performance dashboard across the whole network.',
    },
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
        <Text style={s.stepLabel}>THE SYSTEM</Text>
        <Text style={s.title}>Build Once.{'\n'}Deliver Everywhere.</Text>
        <Text style={s.subtitle}>
          Your curriculum runs across your whole network. Every student follows the same path, every coach runs the same playbook.
        </Text>

        <View style={flow.wrap}>
          {flowSteps.map((item, idx) => (
            <View key={idx} style={flow.itemWrap}>
              <View style={flow.leftCol}>
                <View style={[flow.iconCircle, { backgroundColor: item.color }]}>
                  {item.icon}
                </View>
                {idx < flowSteps.length - 1 && <View style={flow.line} />}
              </View>
              <View style={flow.textCol}>
                <Text style={flow.itemTitle}>{item.title}</Text>
                <Text style={flow.itemBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomBar dotsTotal={3} dotsActive={2} label="Start My Academy" onPress={onContinue} />
    </View>
  );
}

const flow = StyleSheet.create({
  wrap: { marginBottom: 8 },
  itemWrap: { flexDirection: 'row', gap: 14 },
  leftCol: { alignItems: 'center', width: 42 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
    minHeight: 16,
  },
  textCol: { flex: 1, paddingBottom: 20 },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 3,
    marginTop: 10,
  },
  itemBody: { fontSize: 13, color: '#666666', lineHeight: 18 },
});

// ─── Step 3: Name Your Academy ────────────────────────────────────────────────
function Step3({ onComplete, onBack }) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const trimmed = name.trim();

  return (
    <View style={s.stepContainer}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={26} color="#000000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.heroIconWrap, { backgroundColor: '#E8F5FF' }]}>
          <Home size={28} color="#007AFF" />
        </View>

        <Text style={s.title}>Name Your Academy</Text>
        <Text style={s.subtitle}>
          This is your brand. Choose a name that reflects your coaching identity and the community you're building.
        </Text>

        <Text style={s.inputLabel}>
          Academy Name <Text style={s.required}>*</Text>
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
          onSubmitEditing={() => trimmed && onComplete(trimmed)}
        />
        <Text style={s.hintText}>You can always update this later in your academy settings.</Text>
      </ScrollView>

      {/* Pinned CTA — no dots on step 3 */}
      <View style={bottom.wrap}>
        <PrimaryButton
          label="Create My Academy"
          onPress={() => onComplete(trimmed)}
          disabled={!trimmed}
        />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AcademyOnboardingFlow({ visible, onComplete, onDismiss }) {
  const [step, setStep] = useState(0);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);
  const skipToName = () => setStep(3);

  const handleDismiss = () => {
    setStep(0);
    onDismiss();
  };

  const handleComplete = (academyName) => {
    setStep(0);
    onComplete(academyName);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={s.safeArea}>
        {step === 0 && <Step0 onContinue={next} onSkip={skipToName} onClose={handleDismiss} />}
        {step === 1 && <Step1 onContinue={next} onBack={back} onSkip={skipToName} />}
        {step === 2 && <Step2 onContinue={next} onBack={back} onSkip={skipToName} />}
        {step === 3 && <Step3 onComplete={handleComplete} onBack={back} />}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
  },
  cardsWrap: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  required: { color: '#007AFF' },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  textInputFocused: { borderColor: '#007AFF' },
  hintText: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 17,
    marginBottom: 24,
  },
});
