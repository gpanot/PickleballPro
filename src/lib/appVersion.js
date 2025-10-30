// App Version Management
// This file helps manage app versions for authentication persistence

import { version } from '../../package.json';

export const APP_VERSION = version;

// Helper function to check if this is a major version update
export const isMajorVersionUpdate = (oldVersion, newVersion) => {
  if (!oldVersion || !newVersion) return false;
  
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  // Major version is the first number
  return newParts[0] > oldParts[0];
};

// Helper function to check if this is a minor version update
export const isMinorVersionUpdate = (oldVersion, newVersion) => {
  if (!oldVersion || !newVersion) return false;
  
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  // Minor version is the second number
  return newParts[0] === oldParts[0] && newParts[1] > oldParts[1];
};

// Helper function to check if this is a patch version update
export const isPatchVersionUpdate = (oldVersion, newVersion) => {
  if (!oldVersion || !newVersion) return false;
  
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  // Patch version is the third number
  return newParts[0] === oldParts[0] && 
         newParts[1] === oldParts[1] && 
         newParts[2] > oldParts[2];
};

// Helper function to determine if session should be preserved
export const shouldPreserveSession = (oldVersion, newVersion) => {
  if (!oldVersion || !newVersion) return true; // First install, preserve if possible
  
  // For major version updates, we might want to clear some data
  // but preserve authentication
  if (isMajorVersionUpdate(oldVersion, newVersion)) {
    console.log('🔄 Major version update detected, preserving session but may clear some cached data');
    return true;
  }
  
  // For minor and patch updates, always preserve session
  return true;
};

export default {
  APP_VERSION,
  isMajorVersionUpdate,
  isMinorVersionUpdate,
  isPatchVersionUpdate,
  shouldPreserveSession
};
