/**
 * Unit tests for the business logic inside assessmentTemplatesApi.
 *
 * We cannot directly `require` the real API module because it imports
 * react-native packages that Jest cannot parse without a full RN transform.
 * Instead we inline the exact logic extracted from the real file so we can
 * verify the decision rules without any native / Supabase I/O.
 */

// ─── Inline business logic ────────────────────────────────────────────────────
// These functions mirror the real implementation in src/lib/assessmentTemplatesApi.js

/**
 * Builds the payload sent to Supabase for save operations.
 * Rules:
 *   - INSERT (no id): new row; is_default = isDefault (explicit, default false), academy_id = academyId
 *   - UPDATE (has id): existing row; patch mutable fields
 *   - is_default must NEVER be inferred from !academyId — solo coaches have no academy but are not superadmins
 */
function buildSavePayload({ id, type, name, description, template, academyId, isDefault = false }) {
  const base = { type, name, description, template };
  if (!id) {
    return {
      ...base,
      is_default: isDefault,
      academy_id: academyId || null,
    };
  }
  return { ...base, id };
}

/**
 * Validates the delete response. Mirrors the guard in deleteAssessmentTemplate.
 * Returns undefined on success, throws on failure.
 */
function validateDeleteResponse({ data, error }) {
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Delete was blocked by the database (RLS policy).');
  }
  return undefined;
}

// ─── buildSavePayload: INSERT branch ─────────────────────────────────────────

describe('buildSavePayload — INSERT (no id)', () => {
  test('coach with academy: is_default=false, academy_id set', () => {
    const payload = buildSavePayload({
      id: undefined,
      type: 'experience',
      name: 'My First Template',
      description: 'A description',
      template: { questions: [] },
      academyId: 'acad-123',
      isDefault: false,
    });
    expect(payload.is_default).toBe(false);
    expect(payload.academy_id).toBe('acad-123');
    expect(payload.id).toBeUndefined();
  });

  test('solo coach (no academy): is_default=false even without academyId', () => {
    // KEY FIX: solo coaches have academyId=null but must NOT get is_default=true
    const payload = buildSavePayload({
      id: undefined,
      type: 'experience',
      name: 'Solo Coach Template',
      description: '',
      template: { questions: [] },
      academyId: null,
      isDefault: false,  // explicitly false — not inferred from !academyId
    });
    expect(payload.is_default).toBe(false);
    expect(payload.academy_id).toBeNull();
  });

  test('superadmin creating a system default: is_default=true, academy_id=null (explicit)', () => {
    const payload = buildSavePayload({
      id: undefined,
      type: 'experience',
      name: 'Global Default',
      description: '',
      template: { questions: [] },
      academyId: null,
      isDefault: true,  // superadmin explicitly sets this
    });
    expect(payload.is_default).toBe(true);
    expect(payload.academy_id).toBeNull();
  });

  test('isDefault defaults to false when omitted', () => {
    const payload = buildSavePayload({
      id: undefined,
      type: 'skill',
      name: 'New Skill',
      description: '',
      template: {},
      academyId: null,
      // isDefault intentionally omitted — must default to false
    });
    expect(payload.is_default).toBe(false);
  });
});

// ─── buildSavePayload: UPDATE branch ──────────────────────────────────────────

describe('buildSavePayload — UPDATE (has id)', () => {
  test('existing template: preserves id, patches name', () => {
    const payload = buildSavePayload({
      id: 'tmpl-existing',
      type: 'experience',
      name: 'Renamed',
      description: 'Updated',
      template: { questions: [1] },
      academyId: 'acad-123',
    });
    expect(payload.id).toBe('tmpl-existing');
    expect(payload.name).toBe('Renamed');
    // UPDATE payload should NOT include is_default or academy_id changes
    expect(payload.is_default).toBeUndefined();
    expect(payload.academy_id).toBeUndefined();
  });
});

// ─── validateDeleteResponse ────────────────────────────────────────────────────

describe('validateDeleteResponse — delete guard', () => {
  test('success: resolves when rows are returned', () => {
    expect(validateDeleteResponse({ data: [{ id: 'tmpl-1' }], error: null })).toBeUndefined();
  });

  test('success: resolves when multiple rows returned', () => {
    expect(validateDeleteResponse({ data: [{ id: 'a' }, { id: 'b' }], error: null })).toBeUndefined();
  });

  test('RLS block: throws when data is empty array', () => {
    expect(() => validateDeleteResponse({ data: [], error: null })).toThrow(
      /blocked by the database/
    );
  });

  test('RLS block: throws when data is null', () => {
    expect(() => validateDeleteResponse({ data: null, error: null })).toThrow(
      /blocked by the database/
    );
  });

  test('Supabase error: throws the error object', () => {
    const err = new Error('foreign key violation');
    expect(() => validateDeleteResponse({ data: null, error: err })).toThrow('foreign key violation');
  });

  test('Supabase error takes priority over null data', () => {
    const err = new Error('RLS violation');
    expect(() => validateDeleteResponse({ data: [], error: err })).toThrow('RLS violation');
  });
});

// ─── "Save as my copy" scenario (coach duplicating a system default) ───────────

describe('buildSavePayload — Save as my copy (coach duplicating a system default)', () => {
  test('coach with academy: strips id, creates INSERT with academy_id, is_default=false', () => {
    const payload = buildSavePayload({
      id: undefined,         // intentionally stripped by TemplateEditor
      type: 'experience',
      name: 'Experience Assessment (copy)',
      description: '',
      template: { questions: [] },
      academyId: 'acad-coach',
      isDefault: false,
    });
    expect(payload.id).toBeUndefined();
    expect(payload.is_default).toBe(false);
    expect(payload.academy_id).toBe('acad-coach');
  });

  test('solo coach (no academy): strips id, creates INSERT with academy_id=null, is_default=false', () => {
    // Solo coaches (no academy) duplicate a system default as their own personal copy
    const payload = buildSavePayload({
      id: undefined,
      type: 'experience',
      name: 'Experience Assessment (copy)',
      description: '',
      template: { questions: [] },
      academyId: null,
      isDefault: false,  // must NOT become true just because academyId is null
    });
    expect(payload.id).toBeUndefined();
    expect(payload.is_default).toBe(false);
    expect(payload.academy_id).toBeNull();
  });
});
