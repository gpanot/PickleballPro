import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Mail, ShieldCheck, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';
import { PRIVACY_POLICY_URL } from '../lib/legalUrls';

export default function HelpSupportScreen({ navigation }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const supportEmail = 'gpanot@yahoo.fr';
  const privacyPolicyUrl = PRIVACY_POLICY_URL;

  const faqs = [
    { id: 1, question: 'How do I update my skill rating?', answer: 'Go to your Profile screen and tap on the rating section. You can manually edit your rating or sync it from your official account.' },
    { id: 2, question: 'How do I track my progress?', answer: 'Use the Logbook feature to record your training sessions, drills, and match results. You can access it from the main menu.' },
    { id: 3, question: 'Can I create custom training programs?', answer: 'Yes! Navigate to the Programs screen and you can create custom training programs tailored to your skill level and goals.' },
    { id: 4, question: 'How do I earn badges?', answer: 'Badges are earned by completing training programs, reaching skill milestones, and consistently practicing. Check your Profile to see available badges.' },
    { id: 5, question: 'How do I delete my account?', answer: 'Go to Profile > Settings, scroll to the bottom and tap "How do I delete my account" for detailed instructions.' },
  ];

  const handleEmailSupport = async () => {
    const subject = 'Support Request - AcademyPro';
    const body = 'Please describe your issue or question:';
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) await Linking.openURL(mailtoUrl);
      else Alert.alert('Email Support', `Please contact us at: ${supportEmail}`);
    } catch {
      Alert.alert('Email Support', `Please contact us at: ${supportEmail}`);
    }
  };

  const handlePrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(privacyPolicyUrl);
      if (supported) await Linking.openURL(privacyPolicyUrl);
      else Alert.alert('Error', 'Unable to open Privacy Policy');
    } catch {
      Alert.alert('Error', 'Failed to open Privacy Policy');
    }
  };

  const cardStyle = {
    backgroundColor: t.surface,
    borderRadius: t.radiusCard,
    borderWidth: isDark ? 1 : 0,
    borderColor: t.border,
    overflow: 'hidden',
  };

  const renderSection = (title, children) => (
    <View style={[styles.section, { paddingHorizontal: t.headerPaddingH }]}>
      <Text style={[styles.sectionTitle, {
        color: t.sectionLabelColor,
        fontFamily: t.fontBodySemibold,
        letterSpacing: t.sectionLabelTracking,
        fontSize: t.sectionLabelSize + 1,
      }]}>
        {title.toUpperCase()}
      </Text>
      <View style={cardStyle}>{children}</View>
    </View>
  );

  const renderContactOption = (Icon, label, description, onPress, iconColor) => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.contactIconContainer, { backgroundColor: `${iconColor}22` }]}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={[styles.contactLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{label}</Text>
        <Text style={[styles.contactDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>{description}</Text>
      </View>
      <ChevronRight size={18} color={t.textMuted} strokeWidth={2} />
    </TouchableOpacity>
  );

  const renderFaqItem = (faq, index) => {
    const isExpanded = expandedFaq === faq.id;
    const isLast = index === faqs.length - 1;
    return (
      <TouchableOpacity
        key={faq.id}
        style={[styles.faqItem, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: isDark ? t.border : '#F3F4F6' }]}
        onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{faq.question}</Text>
          {isExpanded
            ? <ChevronUp size={18} color={t.textMuted} strokeWidth={2} />
            : <ChevronDown size={18} color={t.textMuted} strokeWidth={2} />}
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, { color: t.textMuted, fontFamily: t.fontBody }]}>{faq.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell tokens={t} isDark={isDark} background="bg" bordered title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderSection('Contact Support', (
          renderContactOption(Mail, 'Email Support', 'Get help via email', handleEmailSupport, t.accentPurple)
        ))}

        {renderSection('Frequently Asked Questions', (
          <>{faqs.map((faq, i) => renderFaqItem(faq, i))}</>
        ))}

        {renderSection('Legal & Privacy', (
          renderContactOption(ShieldCheck, 'Privacy Policy', 'View our privacy policy', handlePrivacyPolicy, '#10B981')
        ))}

        <View style={[styles.appInfoContainer]}>
          <Text style={[styles.appInfoTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>AcademyPro</Text>
          <Text style={[styles.appInfoSubtitle, { color: t.textMuted, fontFamily: t.fontBody }]}>Version 1.0.0</Text>
          <Text style={[styles.appInfoDescription, { color: t.textCaption, fontFamily: t.fontBody }]}>Your personal sports training companion</Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafeArea: { zIndex: 10 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  section: { marginTop: 24 },
  sectionTitle: { textTransform: 'uppercase', marginBottom: 10 },
  contactOption: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  contactIconContainer: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactTextContainer: { flex: 1 },
  contactLabel: { fontSize: 15, marginBottom: 2 },
  contactDescription: { fontSize: 13 },
  faqItem: { padding: 16 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, flex: 1, marginRight: 12 },
  faqAnswer: { fontSize: 13, lineHeight: 20, marginTop: 10, paddingRight: 20 },
  appInfoContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  appInfoTitle: { fontSize: 16, marginBottom: 4 },
  appInfoSubtitle: { fontSize: 13, marginBottom: 6 },
  appInfoDescription: { fontSize: 12, textAlign: 'center' },
  bottomSpacing: { height: 32 },
});
