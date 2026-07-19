/**
 * Unit tests for the UI-level permission derivations in AssessmentsPanel.
 *
 * These are pure functions extracted from the component logic so they can
 * be tested without any React Native / Supabase dependency.
 *
 * Rules under test:
 *   isSuperAdmin   — no academyId AND sessionRole is not manager/coach
 *   memberViewingDefault — is a global default AND not superadmin AND has academyId
 *   canEditDefault — only true for superadmins (passed to TemplateListCard)
 *   effectiveReadOnly — true when readOnly=true OR memberViewingDefault
 */

// ─── Pure logic extracted from AssessmentsPanel ───────────────────────────────

function deriveIsSuperAdmin({ academyId, sessionRole }) {
  return !academyId && sessionRole !== 'manager' && sessionRole !== 'coach';
}

function deriveMemberViewingDefault({ template, isSuperAdmin, academyId }) {
  const isGlobalDefault = template.is_default && !template.academy_id;
  return isGlobalDefault && !isSuperAdmin && !!academyId;
}

function deriveEffectiveReadOnly({ readOnly, memberViewingDefault }) {
  return readOnly || memberViewingDefault;
}

// Card-level: can a user edit/delete a system-default card?
function deriveCanEditDefaultCard({ isDefault, isSuperAdmin }) {
  return !isDefault || isSuperAdmin;  // shows buttons when own template OR superadmin
}

// ─── isSuperAdmin ─────────────────────────────────────────────────────────────

describe('isSuperAdmin derivation', () => {
  test('superadmin: no academyId, no specific role', () => {
    expect(deriveIsSuperAdmin({ academyId: null, sessionRole: 'admin' })).toBe(true);
    expect(deriveIsSuperAdmin({ academyId: undefined, sessionRole: undefined })).toBe(true);
    expect(deriveIsSuperAdmin({ academyId: null, sessionRole: 'superadmin' })).toBe(true);
  });

  test('NOT superadmin: has an academyId (coach or manager)', () => {
    expect(deriveIsSuperAdmin({ academyId: 'acad-1', sessionRole: 'coach' })).toBe(false);
    expect(deriveIsSuperAdmin({ academyId: 'acad-1', sessionRole: 'manager' })).toBe(false);
    expect(deriveIsSuperAdmin({ academyId: 'acad-1', sessionRole: 'admin' })).toBe(false);
  });

  test('NOT superadmin: no academyId but role is manager', () => {
    expect(deriveIsSuperAdmin({ academyId: null, sessionRole: 'manager' })).toBe(false);
  });

  test('NOT superadmin: no academyId but role is coach', () => {
    expect(deriveIsSuperAdmin({ academyId: null, sessionRole: 'coach' })).toBe(false);
  });

  test('NOT superadmin: solo coach (no academy, sessionRole=coach) — the test94 scenario', () => {
    // test94@test.com: sessionRole='coach', academyId=null (solo coach, no academy_members row)
    // Must NOT be treated as superadmin — they cannot write system defaults
    expect(deriveIsSuperAdmin({ academyId: null, sessionRole: 'coach' })).toBe(false);
  });
});

// ─── memberViewingDefault ─────────────────────────────────────────────────────

describe('memberViewingDefault derivation', () => {
  const systemDefault = { is_default: true, academy_id: null };
  const ownTemplate   = { is_default: false, academy_id: 'acad-1' };
  const academyDefault = { is_default: true, academy_id: 'acad-1' }; // edge case

  test('true: coach/manager with academyId viewing a system default', () => {
    expect(deriveMemberViewingDefault({ template: systemDefault, isSuperAdmin: false, academyId: 'acad-1' })).toBe(true);
  });

  test('false: superadmin viewing a system default (can edit directly)', () => {
    expect(deriveMemberViewingDefault({ template: systemDefault, isSuperAdmin: true, academyId: null })).toBe(false);
  });

  test('false: coach viewing their own template (not a system default)', () => {
    expect(deriveMemberViewingDefault({ template: ownTemplate, isSuperAdmin: false, academyId: 'acad-1' })).toBe(false);
  });

  test('false: coach viewing an academy-scoped default (has academy_id so not a global default)', () => {
    expect(deriveMemberViewingDefault({ template: academyDefault, isSuperAdmin: false, academyId: 'acad-1' })).toBe(false);
  });

  test('false: coach with no academyId yet viewing a system default (edge: no academy to copy into)', () => {
    expect(deriveMemberViewingDefault({ template: systemDefault, isSuperAdmin: false, academyId: null })).toBe(false);
  });
});

// ─── effectiveReadOnly ────────────────────────────────────────────────────────

describe('effectiveReadOnly derivation', () => {
  test('true when readOnly prop is true regardless of memberViewingDefault', () => {
    expect(deriveEffectiveReadOnly({ readOnly: true, memberViewingDefault: false })).toBe(true);
    expect(deriveEffectiveReadOnly({ readOnly: true, memberViewingDefault: true })).toBe(true);
  });

  test('true when memberViewingDefault is true even if readOnly is false', () => {
    expect(deriveEffectiveReadOnly({ readOnly: false, memberViewingDefault: true })).toBe(true);
  });

  test('false when neither readOnly nor memberViewingDefault', () => {
    expect(deriveEffectiveReadOnly({ readOnly: false, memberViewingDefault: false })).toBe(false);
  });
});

// ─── Card: canEditDefault (edit/delete buttons on system default cards) ────────

describe('card action button visibility', () => {
  test('superadmin sees edit+delete on system default cards', () => {
    expect(deriveCanEditDefaultCard({ isDefault: true, isSuperAdmin: true })).toBe(true);
  });

  test('coach/manager does NOT see edit+delete on system default cards', () => {
    expect(deriveCanEditDefaultCard({ isDefault: true, isSuperAdmin: false })).toBe(false);
  });

  test('coach/manager sees edit+delete on their own templates', () => {
    expect(deriveCanEditDefaultCard({ isDefault: false, isSuperAdmin: false })).toBe(true);
  });

  test('superadmin sees edit+delete on any template', () => {
    expect(deriveCanEditDefaultCard({ isDefault: false, isSuperAdmin: true })).toBe(true);
  });
});

// ─── End-to-end scenario table ────────────────────────────────────────────────

describe('full permission matrix', () => {
  const systemDefault = { is_default: true, academy_id: null };
  const ownTemplate   = { is_default: false, academy_id: 'acad-1' };

  const scenarios = [
    // [description, role, academyId, template, expectSuperAdmin, expectMemberViewingDefault, expectEffectiveReadOnly, expectCanEdit]
    ['Superadmin on system default',             'admin',   null,     systemDefault, true,  false, false, true],
    ['Superadmin on own template',               'admin',   null,     ownTemplate,   true,  false, false, true],
    ['Coach (with academy) on system default',   'coach',   'acad-1', systemDefault, false, true,  true,  false],
    ['Coach (with academy) on own template',     'coach',   'acad-1', ownTemplate,   false, false, false, true],
    ['Manager on system default',                'manager', 'acad-1', systemDefault, false, true,  true,  false],
    ['Manager on own template',                  'manager', 'acad-1', ownTemplate,   false, false, false, true],
    // Solo coach (test94 scenario): no academy, role=coach — NOT superadmin, NOT memberViewingDefault
    // They can create own templates (academy_id=null, is_default=false) via solo_coach RLS policy
    ['Solo coach on system default (test94)',    'coach',   null,     systemDefault, false, false, false, false],
    ['Solo coach on own template (test94)',      'coach',   null,     ownTemplate,   false, false, false, true],
  ];

  test.each(scenarios)(
    '%s',
    (desc, sessionRole, academyId, template, expSuperAdmin, expMemberViewing, expEffectiveReadOnly, expCanEdit) => {
      const isSuperAdmin = deriveIsSuperAdmin({ academyId, sessionRole });
      const memberViewing = deriveMemberViewingDefault({ template, isSuperAdmin, academyId });
      const effectiveReadOnly = deriveEffectiveReadOnly({ readOnly: false, memberViewingDefault: memberViewing });
      const canEdit = deriveCanEditDefaultCard({ isDefault: template.is_default, isSuperAdmin });

      expect(isSuperAdmin).toBe(expSuperAdmin);
      expect(memberViewing).toBe(expMemberViewing);
      expect(effectiveReadOnly).toBe(expEffectiveReadOnly);
      expect(canEdit).toBe(expCanEdit);
    }
  );
});
