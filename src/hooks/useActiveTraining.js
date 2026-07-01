import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getActiveTrainingTracks,
  setActiveTrack,
  archiveActiveTrack,
  saveForLater,
  updateTrainingResume,
} from '../lib/trainingTracksApi';

/**
 * useActiveTraining
 *
 * Manages the user's active training tracks (primary + up to 2 skill slots).
 * Wraps the Supabase RPCs and exposes simple enroll/archive/resume actions.
 *
 * Usage:
 *   const { tracks, loading, refreshing, loadTracks, refreshTracks, ... } = useActiveTraining();
 */
export function useActiveTraining() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);
  const tracksRef = useRef([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const fetchTracks = useCallback(async () => {
    const data = await getActiveTrainingTracks();
    setTracks(data);
    hasLoadedRef.current = true;
    return data;
  }, []);

  /** Initial load only — shows skeleton when no cached tracks. Skips if already loaded. */
  const loadTracks = useCallback(async () => {
    if (loadingRef.current || hasLoadedRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      await fetchTracks();
    } catch (err) {
      console.error('useActiveTraining.loadTracks error:', err);
      setError(err?.message || 'Failed to load training tracks');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchTracks]);

  /** Pull-to-refresh — never replaces UI with skeleton. */
  const refreshTracks = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);
    setError(null);
    try {
      await fetchTracks();
    } catch (err) {
      console.error('useActiveTraining.refreshTracks error:', err);
      setError(err?.message || 'Failed to load training tracks');
    } finally {
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [fetchTracks]);

  /** Silent reload after mutations (enroll, archive). */
  const reloadTracks = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      await fetchTracks();
    } catch (err) {
      console.error('useActiveTraining.reloadTracks error:', err);
      setError(err?.message || 'Failed to load training tracks');
    } finally {
      loadingRef.current = false;
    }
  }, [fetchTracks]);

  const enrollAsPrimary = useCallback(async (programId) => {
    await setActiveTrack(programId, 'primary');
    await reloadTracks();
  }, [reloadTracks]);

  const enrollAsSkill = useCallback(async (programId) => {
    const skillTracks = tracksRef.current.filter(t =>
      t.trackRole === 'skill_1' || t.trackRole === 'skill_2'
    );

    let slot;
    if (!tracksRef.current.find(t => t.trackRole === 'skill_1')) {
      slot = 'skill_1';
    } else if (!tracksRef.current.find(t => t.trackRole === 'skill_2')) {
      slot = 'skill_2';
    } else {
      throw new Error('SKILL_SLOTS_FULL');
    }

    await setActiveTrack(programId, slot);
    await reloadTracks();
    return slot;
  }, [reloadTracks]);

  const enrollWithRole = useCallback(async (programId, role) => {
    await setActiveTrack(programId, role);
    await reloadTracks();
  }, [reloadTracks]);

  const archiveTrack = useCallback(async (programId) => {
    await archiveActiveTrack(programId);
    await reloadTracks();
  }, [reloadTracks]);

  const saveProgram = useCallback(async (programId, userId) => {
    await saveForLater(programId, userId);
  }, []);

  const updateResume = useCallback(async (programId, routineId) => {
    await updateTrainingResume(programId, routineId);
    setTracks(prev =>
      prev.map(t =>
        t.program.id === programId
          ? { ...t, currentRoutineId: routineId, lastAccessedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const primaryTrack = tracks.find(t => t.trackRole === 'primary') || null;
  const skillTracks = tracks.filter(t => t.trackRole === 'skill_1' || t.trackRole === 'skill_2');
  const skillSlotsFull = skillTracks.length >= 2;

  return {
    tracks,
    primaryTrack,
    skillTracks,
    skillSlotsFull,
    loading,
    refreshing,
    error,
    loadTracks,
    refreshTracks,
    enrollAsPrimary,
    enrollAsSkill,
    enrollWithRole,
    archiveTrack,
    saveProgram,
    updateResume,
  };
}
