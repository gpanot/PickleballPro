// =====================================================
// DEEP LINK HANDLER FOR PROGRAM SHARING
// Handles incoming deep links for shared programs
// =====================================================

import { Linking, Alert } from 'react-native';
import { supabase } from './supabase';

/**
 * Initialize deep link handling
 * Call this in App.js or main navigation component
 */
export const initializeDeepLinkHandling = (navigation) => {
  // Handle deep links when app is already open
  const handleDeepLink = (url) => {
    console.log('🔗 [DeepLink] Received deep link:', url);
    handleProgramShareLink(url, navigation);
  };

  // Listen for deep links
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  // Handle deep link when app is opened from closed state
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🔗 [DeepLink] Initial URL:', url);
      handleDeepLink(url);
    }
  });

  return () => {
    subscription?.remove();
  };
};

/**
 * Handle program share deep links
 * Format: pickleballhero://program/share/{program_id}?token={share_token}
 */
const handleProgramShareLink = async (url, navigation) => {
  try {
    console.log('🔗 [DeepLink] Processing program share link:', url);

    // Parse the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Check if it's a program share link
    if (urlObj.protocol !== 'pickleballhero:' || pathParts[1] !== 'program' || pathParts[2] !== 'share') {
      console.log('🔗 [DeepLink] Not a program share link, ignoring');
      return;
    }

    const programId = pathParts[3];
    const shareToken = urlObj.searchParams.get('token');

    if (!programId || !shareToken) {
      console.error('❌ [DeepLink] Invalid share link: missing program ID or token');
      Alert.alert('Invalid Link', 'This share link is not valid.');
      return;
    }

    console.log('🔗 [DeepLink] Parsed share link:', { programId, shareToken });

    // Get program details using share token
    const { data: programData, error } = await supabase.rpc('get_program_by_share_token', {
      token: shareToken
    });

    if (error) {
      console.error('❌ [DeepLink] Error fetching shared program:', error);
      Alert.alert('Error', 'Failed to load shared program. Please try again.');
      return;
    }

    if (!programData || programData.length === 0) {
      console.log('❌ [DeepLink] Program not found or not shareable');
      Alert.alert('Program Not Found', 'This program is no longer available for sharing.');
      return;
    }

    const program = programData[0];
    console.log('✅ [DeepLink] Found shared program:', program.name);

    // Show confirmation dialog to add program
    Alert.alert(
      'Add Shared Program',
      `"${program.name}" has been shared with you.\n\n${program.routines_count} sessions • Created by another user\n\nWould you like to add this program to your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Program',
          onPress: () => addSharedProgramToCollection(program, navigation)
        }
      ]
    );

  } catch (error) {
    console.error('💥 [DeepLink] Error handling program share link:', error);
    Alert.alert('Error', 'Failed to process share link.');
  }
};

/**
 * Add shared program to user's collection
 */
const addSharedProgramToCollection = async (sharedProgram, navigation) => {
  try {
    console.log('➕ [DeepLink] Adding shared program to collection:', sharedProgram.name);

    // Load full program details with routines and exercises
    const { data: fullProgram, error: loadError } = await supabase
      .from('programs')
      .select(`
        *,
        routines (
          id,
          name,
          description,
          order_index,
          time_estimate_minutes,
          exercises (
            id,
            code,
            title,
            description,
            goal_text,
            difficulty,
            target_value,
            target_unit,
            estimated_minutes,
            skill_category,
            skill_categories_json
          )
        )
      `)
      .eq('id', sharedProgram.id)
      .eq('is_shareable', true)
      .single();

    if (loadError || !fullProgram) {
      console.error('❌ [DeepLink] Error loading full program details:', loadError);
      Alert.alert('Error', 'Failed to load program details.');
      return;
    }

    // Create a copy for the user's collection
    const userProgram = {
      ...fullProgram,
      id: Date.now().toString(), // New ID for user's collection
      addedFromShare: true,
      sharedBy: sharedProgram.created_by,
      originalProgramId: sharedProgram.id,
      addedAt: new Date().toISOString(),
    };

    console.log('✅ [DeepLink] Created user program copy');

    // Navigate to Programs screen and pass the new program
    navigation.navigate('Training2', { 
      newProgram: userProgram 
    });

    Alert.alert(
      'Program Added! 🎉',
      `"${sharedProgram.name}" has been added to your program collection.`
    );

    // Increment share count for the original program
    try {
      await supabase.rpc('increment_program_share_count', {
        program_id: sharedProgram.id
      });
      console.log('✅ [DeepLink] Share count incremented');
    } catch (countError) {
      console.log('⚠️ [DeepLink] Failed to increment share count:', countError);
    }

  } catch (error) {
    console.error('💥 [DeepLink] Error adding shared program:', error);
    Alert.alert('Error', 'Failed to add program to your collection.');
  }
};

/**
 * Utility function to check if a URL is a valid program share link
 */
export const isProgramShareLink = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    return (
      urlObj.protocol === 'pickleballhero:' &&
      pathParts[1] === 'program' &&
      pathParts[2] === 'share' &&
      pathParts[3] && // program ID
      urlObj.searchParams.get('token') // share token
    );
  } catch {
    return false;
  }
};

/**
 * Extract program info from share link without making API calls
 */
export const extractProgramInfoFromShareLink = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    return {
      programId: pathParts[3],
      shareToken: urlObj.searchParams.get('token')
    };
  } catch {
    return null;
  }
};
