import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ModernIcon from '../components/ModernIcon';

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const supportEmail = 'gpanot@yahoo.fr';
  const privacyPolicyUrl = 'https://prism-8db991.ingress-haven.ewp.live/privacy-policy-piklepro-pickleball-hero/';

  const faqs = [
    {
      id: 1,
      question: 'How do I update my DUPR rating?',
      answer: 'Go to your Profile screen and tap on the DUPR rating section. You can manually edit your rating or sync it from your official DUPR account.'
    },
    {
      id: 2,
      question: 'How do I track my progress?',
      answer: 'Use the Logbook feature to record your training sessions, drills, and match results. You can access it from the main menu.'
    },
    {
      id: 3,
      question: 'Can I create custom training programs?',
      answer: 'Yes! Navigate to the Programs screen and you can create custom training programs tailored to your skill level and goals.'
    },
    {
      id: 4,
      question: 'How do I earn badges?',
      answer: 'Badges are earned by completing training programs, reaching skill milestones, and consistently practicing. Check your Profile to see available badges.'
    },
    {
      id: 5,
      question: 'How do I delete my account?',
      answer: 'Go to Profile > Settings, scroll to the bottom and tap "How do I delete my account" for detailed instructions.'
    }
  ];

  const handleEmailSupport = async () => {
    const subject = 'Support Request - PiklePro';
    const body = 'Please describe your issue or question:';
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Email Support', `Please contact us at: ${supportEmail}`);
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert('Email Support', `Please contact us at: ${supportEmail}`);
    }
  };

  const handlePrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(privacyPolicyUrl);
      if (supported) {
        await Linking.openURL(privacyPolicyUrl);
      } else {
        Alert.alert('Error', 'Unable to open Privacy Policy');
      }
    } catch (error) {
      console.error('Error opening Privacy Policy:', error);
      Alert.alert('Error', 'Failed to open Privacy Policy');
    }
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
          size={24} 
          color="#007AFF" 
        />
      </TouchableOpacity>
      <Text style={styles.topBarTitle}>Help & Support</Text>
      <View style={styles.topBarRightSpace} />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderContactOption = (icon, label, description, onPress, iconColor = '#6B7280') => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.contactIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <ModernIcon name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactDescription}>{description}</Text>
      </View>
      <ModernIcon name="action" size={8} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderFaqItem = (faq) => {
    const isExpanded = expandedFaq === faq.id;
    
    return (
      <TouchableOpacity
        key={faq.id}
        style={styles.faqItem}
        onPress={() => toggleFaq(faq.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6B7280" 
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{faq.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        {renderTopBar()}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Support */}
        {renderSection('Contact Support', (
          <View style={styles.sectionContent}>
            {renderContactOption(
              'email',
              'Email Support',
              'Get help via email',
              handleEmailSupport,
              '#3B82F6'
            )}
          </View>
        ))}

        {/* FAQs */}
        {renderSection('Frequently Asked Questions', (
          <View style={styles.sectionContent}>
            {faqs.map(renderFaqItem)}
          </View>
        ))}

        {/* Legal & Privacy */}
        {renderSection('Legal & Privacy', (
          <View style={styles.sectionContent}>
            {renderContactOption(
              'shield',
              'Privacy Policy',
              'View our privacy policy',
              handlePrivacyPolicy,
              '#10B981'
            )}
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>PiklePro - Pickleball Hero</Text>
          <Text style={styles.appInfoSubtitle}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Your personal pickleball training companion
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: 'white',
    zIndex: 1000,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  topBarRightSpace: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    paddingRight: 24,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appInfoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});

