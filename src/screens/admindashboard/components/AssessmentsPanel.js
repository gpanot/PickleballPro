import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  listAssessmentTemplates,
  saveAssessmentTemplate,
  deleteAssessmentTemplate,
  seedDefaultTemplates,
  DEFAULT_EXPERIENCE_TEMPLATE,
  DEFAULT_PLAYER_EVALUATION_TEMPLATE,
} from '../../../lib/assessmentTemplatesApi';
import { supabase } from '../../../lib/supabase';
import VisualFlowChart from './VisualFlowChart';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const TYPE_LABELS = {
  experience: 'First time',
  player_evaluation: 'Player Evaluation',
};

const TYPE_COLORS = {
  experience: { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  player_evaluation: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

// ─── Sub-editors ─────────────────────────────────────────────────────────────

function OptionRow({ option, onChange, onRemove, readOnly }) {
  return (
    <View style={styles.optionRow}>
      <TextInput
        style={[styles.optionInput, readOnly && styles.inputDisabled]}
        value={option.label}
        onChangeText={v => onChange({ ...option, label: v })}
        placeholder="Label"
        editable={!readOnly}
      />
      <TextInput
        style={[styles.optionInputSmall, readOnly && styles.inputDisabled]}
        value={option.value}
        onChangeText={v => onChange({ ...option, value: v })}
        placeholder="value"
        editable={!readOnly}
        autoCapitalize="none"
      />
      {!readOnly && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="close-circle" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Human-readable one-liner for a condition (header + summary). */
function formatConditionSummary(condition, previousQuestions = []) {
  if (!condition) return 'Always shown';
  const source = previousQuestions.find(q => q.id === condition.key);
  const sourceLabel = source?.question?.trim()
    ? truncateLabel(source.question, 42)
    : condition.key || 'previous answer';
  const opts = source?.options || [];
  if (condition.mustExist) {
    const opt = opts.find(o => o.value === condition.notValue);
    const valLabel = opt?.label || condition.notValue || '?';
    return `When “${sourceLabel}” is not “${valLabel}”`;
  }
  const opt = opts.find(o => o.value === condition.value);
  const valLabel = opt?.label || condition.value || '?';
  return `When “${sourceLabel}” = “${valLabel}”`;
}

function truncateLabel(text, max) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Editable branching rule for First-time questions.
 * Shapes match evaluateCondition():
 *   null                         → always
 *   { key, value }               → equals
 *   { key, notValue, mustExist } → exists and is not
 */
function ConditionEditor({ condition, previousQuestions, onChange, readOnly }) {
  const canBranch = previousQuestions.length > 0;
  const isConditional = !!condition;
  const matchMode = condition?.mustExist ? 'not' : 'equals';

  const selectedKey = condition?.key || previousQuestions[0]?.id || null;
  const sourceQuestion = previousQuestions.find(q => q.id === selectedKey) || null;
  const keyMissing = isConditional && condition?.key && !sourceQuestion;
  const sourceOptions = sourceQuestion?.options || [];
  const selectedValue = condition?.mustExist ? condition.notValue : condition?.value;

  const setAlways = () => onChange(null);

  const startConditional = () => {
    const first = previousQuestions[0];
    if (!first) return;
    const firstOpt = first.options?.[0]?.value ?? '';
    onChange({ key: first.id, value: firstOpt });
  };

  const setSourceKey = (key) => {
    const src = previousQuestions.find(q => q.id === key);
    const firstOpt = src?.options?.[0]?.value ?? '';
    if (matchMode === 'not') {
      onChange({ key, notValue: firstOpt, mustExist: true });
    } else {
      onChange({ key, value: firstOpt });
    }
  };

  const setMatchMode = (mode) => {
    const key = sourceQuestion?.id || previousQuestions[0]?.id;
    if (!key) return;
    const opts = previousQuestions.find(q => q.id === key)?.options || [];
    const current = selectedValue ?? opts[0]?.value ?? '';
    if (mode === 'not') {
      onChange({ key, notValue: current, mustExist: true });
    } else {
      onChange({ key, value: current });
    }
  };

  const setAnswerValue = (value) => {
    const key = sourceQuestion?.id || previousQuestions[0]?.id;
    if (!key) return;
    if (matchMode === 'not') {
      onChange({ key, notValue: value, mustExist: true });
    } else {
      onChange({ key, value });
    }
  };

  // Read-only: compact summary only
  if (readOnly) {
    return (
      <View style={styles.conditionPanel}>
        <View style={styles.conditionSummaryRow}>
          <Ionicons name="git-branch-outline" size={14} color="#6B7280" />
          <Text style={styles.conditionSummaryText}>
            {formatConditionSummary(condition, previousQuestions)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.conditionPanel}>
      <Text style={styles.conditionPanelTitle}>When is this question shown?</Text>
      <Text style={styles.conditionPanelHint}>
        Branching controls the path students take. Later questions can depend on earlier answers.
      </Text>

      {/* Mode: Always vs Conditional */}
      <View style={styles.conditionModeRow}>
        <TouchableOpacity
          style={[styles.conditionModeChip, !isConditional && styles.conditionModeChipActive]}
          onPress={setAlways}
          activeOpacity={0.75}
        >
          <Ionicons
            name="eye-outline"
            size={15}
            color={!isConditional ? '#1D4ED8' : '#6B7280'}
          />
          <Text style={[styles.conditionModeChipText, !isConditional && styles.conditionModeChipTextActive]}>
            Always
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.conditionModeChip,
            isConditional && styles.conditionModeChipActive,
            !canBranch && styles.conditionModeChipDisabled,
          ]}
          onPress={() => {
            if (!canBranch) return;
            if (!isConditional) startConditional();
          }}
          disabled={!canBranch}
          activeOpacity={0.75}
        >
          <Ionicons
            name="git-branch-outline"
            size={15}
            color={!canBranch ? '#D1D5DB' : isConditional ? '#1D4ED8' : '#6B7280'}
          />
          <Text
            style={[
              styles.conditionModeChipText,
              isConditional && styles.conditionModeChipTextActive,
              !canBranch && styles.conditionModeChipTextDisabled,
            ]}
          >
            Only when…
          </Text>
        </TouchableOpacity>
      </View>

      {!canBranch && (
        <Text style={styles.conditionFirstNote}>
          The first question is always shown. Add another question below to create a branch.
        </Text>
      )}

      {isConditional && canBranch && (
        <View style={styles.conditionBuilder}>
          {keyMissing && (
            <View style={styles.conditionWarn}>
              <Ionicons name="warning-outline" size={15} color="#B45309" />
              <Text style={styles.conditionWarnText}>
                This rule points at a question that is no longer above this one (often after reordering).
                Pick an earlier question below.
              </Text>
            </View>
          )}

          {/* Step 1 — which previous question */}
          <Text style={styles.conditionStepLabel}>1. Depends on this earlier answer</Text>
          <View style={styles.conditionChoiceWrap}>
            {previousQuestions.map((q, i) => {
              const selected = q.id === selectedKey;
              const label = q.question?.trim() || `Question ${i + 1}`;
              return (
                <TouchableOpacity
                  key={q.id || i}
                  style={[styles.conditionChoiceChip, selected && styles.conditionChoiceChipActive]}
                  onPress={() => setSourceKey(q.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.conditionChoiceIndex}>{i + 1}</Text>
                  <Text
                    style={[styles.conditionChoiceText, selected && styles.conditionChoiceTextActive]}
                    numberOfLines={2}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Step 2 — equals / is not */}
          <Text style={[styles.conditionStepLabel, { marginTop: 14 }]}>2. Match rule</Text>
          <View style={styles.conditionModeRow}>
            <TouchableOpacity
              style={[styles.conditionMatchChip, matchMode === 'equals' && styles.conditionMatchChipActive]}
              onPress={() => setMatchMode('equals')}
              activeOpacity={0.75}
            >
              <Text style={[styles.conditionMatchChipText, matchMode === 'equals' && styles.conditionMatchChipTextActive]}>
                Equals
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.conditionMatchChip, matchMode === 'not' && styles.conditionMatchChipActive]}
              onPress={() => setMatchMode('not')}
              activeOpacity={0.75}
            >
              <Text style={[styles.conditionMatchChipText, matchMode === 'not' && styles.conditionMatchChipTextActive]}>
                Is not
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.conditionMatchHint}>
            {matchMode === 'equals'
              ? 'Show only if the student picked this exact answer.'
              : 'Show if they answered, and the answer is anything except this value.'}
          </Text>

          {/* Step 3 — which answer value */}
          <Text style={[styles.conditionStepLabel, { marginTop: 14 }]}>3. Answer value</Text>
          {sourceOptions.length === 0 ? (
            <Text style={styles.conditionEmptyOpts}>
              {keyMissing
                ? 'Select an earlier question first to choose an answer value.'
                : 'That question has no options yet. Add options above, then pick a value here.'}
            </Text>
          ) : (
            <View style={styles.conditionChoiceWrap}>
              {sourceOptions.map((opt, i) => {
                const selected = opt.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={`${opt.value}-${i}`}
                    style={[styles.conditionValueChip, selected && styles.conditionValueChipActive]}
                    onPress={() => setAnswerValue(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.conditionValueChipText, selected && styles.conditionValueChipTextActive]}>
                      {opt.label?.trim() || opt.value || `Option ${i + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Live preview sentence */}
          {!keyMissing && (
            <View style={styles.conditionPreview}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" />
              <Text style={styles.conditionPreviewText}>
                {formatConditionSummary(condition, previousQuestions)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function QuestionCard({
  question,
  index,
  previousQuestions = [],
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  readOnly,
  isFirst,
  isLast,
}) {
  const [expanded, setExpanded] = useState(true);

  const updateOption = (i, opt) => {
    const next = [...question.options];
    next[i] = opt;
    onChange({ ...question, options: next });
  };

  const addOption = () => {
    onChange({ ...question, options: [...question.options, { label: '', value: uid() }] });
  };

  const removeOption = (i) => {
    onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });
  };

  const conditionSummary = formatConditionSummary(question.condition, previousQuestions);

  return (
    <View style={styles.card}>
      {/* Card header */}
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIndex}>{index + 1}</Text>
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTitle} numberOfLines={1}>{question.question || 'Untitled question'}</Text>
            <Text style={styles.cardConditionHint} numberOfLines={1}>{conditionSummary}</Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {!readOnly && (
            <>
              <TouchableOpacity onPress={onMoveUp} disabled={isFirst} style={styles.iconBtn}>
                <Ionicons name="chevron-up" size={16} color={isFirst ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onMoveDown} disabled={isLast} style={styles.iconBtn}>
                <Ionicons name="chevron-down" size={16} color={isLast ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onRemove} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {/* Question text */}
          <Text style={styles.fieldLabel}>Question</Text>
          <TextInput
            style={[styles.textInput, readOnly && styles.inputDisabled]}
            value={question.question}
            onChangeText={v => onChange({ ...question, question: v })}
            placeholder="Enter question text"
            editable={!readOnly}
            multiline
          />

          {/* Condition editor */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Condition</Text>
          <ConditionEditor
            condition={question.condition}
            previousQuestions={previousQuestions}
            onChange={next => onChange({ ...question, condition: next })}
            readOnly={readOnly}
          />

          {/* Options */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Options</Text>
          {question.options.map((opt, i) => (
            <OptionRow
              key={i}
              option={opt}
              onChange={updated => updateOption(i, updated)}
              onRemove={() => removeOption(i)}
              readOnly={readOnly}
            />
          ))}
          {!readOnly && (
            <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
              <Ionicons name="add-circle-outline" size={15} color="#6366F1" />
              <Text style={styles.addOptionText}>Add option</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}


function CriterionRow({ criterion, onChange, onRemove, readOnly }) {
  return (
    <View style={styles.criterionRow}>
      <TextInput
        style={[styles.criterionLabel, readOnly && styles.inputDisabled]}
        value={criterion.label}
        onChangeText={v => onChange({ ...criterion, label: v })}
        placeholder="Criterion label"
        editable={!readOnly}
      />
      <View style={styles.criterionScoreWrap}>
        <Text style={styles.criterionScorePrefix}>/ </Text>
        <TextInput
          style={[styles.criterionScoreInput, readOnly && styles.inputDisabled]}
          value={String(criterion.maxScore)}
          onChangeText={v => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 1) onChange({ ...criterion, maxScore: n });
          }}
          keyboardType="numeric"
          editable={!readOnly}
        />
      </View>
      {!readOnly && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SkillCard({ skill, index, onChange, onRemove, onMoveUp, onMoveDown, readOnly, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(true);

  const totalCriteria = (skill.criteria || []).reduce((s, c) => s + (c.maxScore || 0), 0);

  const updateCriterion = (i, cr) => {
    const next = [...skill.criteria];
    next[i] = cr;
    const newMax = next.reduce((s, c) => s + (c.maxScore || 0), 0);
    onChange({ ...skill, criteria: next, maxScore: newMax });
  };

  const addCriterion = () => {
    const next = [...skill.criteria, { id: uid(), label: '', maxScore: 10 }];
    onChange({ ...skill, criteria: next, maxScore: next.reduce((s, c) => s + c.maxScore, 0) });
  };

  const removeCriterion = (i) => {
    const next = skill.criteria.filter((_, idx) => idx !== i);
    onChange({ ...skill, criteria: next, maxScore: next.reduce((s, c) => s + c.maxScore, 0) });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIndex}>{index + 1}</Text>
          <View>
            <Text style={styles.cardTitle}>{skill.name || 'Untitled skill'}</Text>
            <Text style={styles.cardSubtitle}>Max: {totalCriteria} pts · {(skill.criteria || []).length} criteria</Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {!readOnly && (
            <>
              <TouchableOpacity onPress={onMoveUp} disabled={isFirst} style={styles.iconBtn}>
                <Ionicons name="chevron-up" size={16} color={isFirst ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onMoveDown} disabled={isLast} style={styles.iconBtn}>
                <Ionicons name="chevron-down" size={16} color={isLast ? '#D1D5DB' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onRemove} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.fieldLabel}>Skill name</Text>
          <TextInput
            style={[styles.textInput, readOnly && styles.inputDisabled]}
            value={skill.name}
            onChangeText={v => onChange({ ...skill, name: v })}
            placeholder="e.g. Serves"
            editable={!readOnly}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Criteria</Text>
          <View style={styles.criterionHeader}>
            <Text style={[styles.criterionHeaderText, { flex: 1 }]}>Label</Text>
            <Text style={styles.criterionHeaderText}>Max pts</Text>
            {!readOnly && <View style={{ width: 30 }} />}
          </View>
          {(skill.criteria || []).map((cr, i) => (
            <CriterionRow
              key={i}
              criterion={cr}
              onChange={updated => updateCriterion(i, updated)}
              onRemove={() => removeCriterion(i)}
              readOnly={readOnly}
            />
          ))}
          {!readOnly && (
            <TouchableOpacity style={styles.addOptionBtn} onPress={addCriterion}>
              <Ionicons name="add-circle-outline" size={15} color="#6366F1" />
              <Text style={styles.addOptionText}>Add criterion</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({ template, onClose, onSaved, readOnly, academyId, isSuperAdmin }) {
  const isExperience = template.type === 'experience';
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(template.name || '');
  const [description, setDescription] = useState(template.description || '');
  const [questions, setQuestions] = useState(
    template.template?.questions
      ? [...template.template.questions]
      : [...DEFAULT_EXPERIENCE_TEMPLATE.questions]
  );
  const [skills, setSkills] = useState(
    template.template?.skills
      ? [...template.template.skills]
      : [...DEFAULT_PLAYER_EVALUATION_TEMPLATE.skills]
  );
  const [saving, setSaving] = useState(false);
  // First-time only: Linear (list editor) vs Visual (flowchart)
  const [builderMode, setBuilderMode] = useState('linear'); // 'linear' | 'visual'
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // For a coach/manager viewing a system default: they see the content read-only
  // and can only "Save as my copy" (creates a new academy-scoped template).
  const isGlobalDefault = template.is_default && !template.academy_id;
  const memberViewingDefault = isGlobalDefault && !isSuperAdmin && !!academyId;
  // Effective read-only: true only if explicitly passed AND not a superadmin override
  const effectiveReadOnly = readOnly || memberViewingDefault;

  const moveItem = (list, setList, i, dir) => {
    const next = [...list];
    const swapIdx = i + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[i], next[swapIdx]] = [next[swapIdx], next[i]];
    setList(next);
  };

  const addQuestion = () => {
    const id = uid();
    setQuestions(prev => [
      ...prev,
      {
        id,
        question: '',
        type: 'button',
        condition: null,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    ]);
    if (builderMode === 'visual') setSelectedQuestionId(id);
  };

  const duplicateQuestion = (questionId) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === questionId);
      if (idx < 0) return prev;
      const source = prev[idx];
      const copy = {
        ...source,
        id: uid(),
        question: source.question ? `${source.question} (copy)` : '',
        options: (source.options || []).map((o) => ({ ...o })),
        condition: source.condition ? { ...source.condition } : null,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      setSelectedQuestionId(copy.id);
      return next;
    });
  };

  const deleteQuestionById = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setSelectedQuestionId((cur) => (cur === questionId ? null : cur));
  };

  const addSkill = () => {
    setSkills(prev => [
      ...prev,
      {
        id: uid(),
        name: '',
        maxScore: 10,
        criteria: [{ id: uid(), label: '', maxScore: 10 }],
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Template name is required.');
      return;
    }
    setSaving(true);
    try {
      // Superadmin updating an existing system default keeps is_default=true.
      // All other saves (new templates, coach/manager saves, "Save as my copy") are is_default=false.
      const keepAsDefault = isSuperAdmin && template.is_default && !template.academy_id && !memberViewingDefault;
      const payload = {
        // memberViewingDefault always creates a new copy scoped to their academy
        id: memberViewingDefault ? undefined : template.id,
        type: template.type,
        name: name.trim(),
        description: description.trim(),
        template: isExperience ? { questions } : { skills },
        academyId: keepAsDefault ? null : (academyId || null),
        isDefault: keepAsDefault,
      };
      console.log('[TemplateEditor] handleSave payload:', JSON.stringify({ id: payload.id, academyId: payload.academyId, isDefault: payload.isDefault, keepAsDefault }));
      await saveAssessmentTemplate(payload);
      onSaved();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = TYPE_COLORS[template.type] || TYPE_COLORS.experience;

  return (
    <View style={styles.editorContainer}>
      {/* Editor Header */}
      <View style={styles.editorHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={styles.backBtnText}>Templates</Text>
        </TouchableOpacity>
        <View style={[styles.typeBadge, { backgroundColor: typeColor.bg, borderColor: typeColor.border }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>{TYPE_LABELS[template.type]}</Text>
        </View>
        {/* Save button — always shown unless fully readOnly; label changes for member viewing a default */}
        {!readOnly && (
          <TouchableOpacity
            style={[styles.saveBtn, memberViewingDefault && styles.saveBtnCopy, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>{memberViewingDefault ? 'Save as my copy' : 'Save'}</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Banner: coach/manager sees system default → changes saved as a personal copy */}
      {memberViewingDefault && (
        <View style={styles.overrideBanner}>
          <Ionicons name="information-circle-outline" size={15} color="#92400E" />
          <Text style={styles.overrideBannerText}>
            This is a system default. Use "Save as my copy" to create your own editable version.
          </Text>
        </View>
      )}

      <ScrollView style={styles.editorScroll} contentContainerStyle={[styles.editorScrollContent, { paddingBottom: Math.max(60, insets.bottom + 40) }]}>
        {/* Meta fields */}
        <View style={styles.metaSection}>
          <Text style={styles.fieldLabel}>Template name</Text>
          <TextInput
            style={[styles.textInput, effectiveReadOnly && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Player Assessment"
            editable={!effectiveReadOnly}
          />

          {/* First-time only: Linear / Visual builder toggle */}
          {isExperience && (
            <View style={styles.builderToggleWrap}>
              <Text style={styles.fieldLabel}>Builder</Text>
              <View style={styles.builderToggle}>
                <TouchableOpacity
                  style={[styles.builderToggleBtn, builderMode === 'linear' && styles.builderToggleBtnActive]}
                  onPress={() => setBuilderMode('linear')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="list-outline"
                    size={15}
                    color={builderMode === 'linear' ? '#18181b' : '#71717a'}
                  />
                  <Text style={[styles.builderToggleText, builderMode === 'linear' && styles.builderToggleTextActive]}>
                    Linear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.builderToggleBtn, builderMode === 'visual' && styles.builderToggleBtnActive]}
                  onPress={() => setBuilderMode('visual')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="git-network-outline"
                    size={15}
                    color={builderMode === 'visual' ? '#18181b' : '#71717a'}
                  />
                  <Text style={[styles.builderToggleText, builderMode === 'visual' && styles.builderToggleTextActive]}>
                    Visual
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>About this assessment (Only you can see it)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMulti, effectiveReadOnly && styles.inputDisabled]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            editable={!effectiveReadOnly}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Items section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {isExperience ? `Questions (${questions.length})` : `Skills (${skills.length})`}
          </Text>
          {!effectiveReadOnly && (
            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={isExperience ? addQuestion : addSkill}
            >
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={styles.addItemBtnText}>{isExperience ? 'Add question' : 'Add skill'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isExperience && builderMode === 'visual' ? (
          <>
            <VisualFlowChart
              questions={questions}
              selectedId={selectedQuestionId}
              onSelect={setSelectedQuestionId}
              onDuplicate={duplicateQuestion}
              onDelete={deleteQuestionById}
              readOnly={effectiveReadOnly}
            />
            {selectedQuestionId ? (
              (() => {
                const i = questions.findIndex((q) => q.id === selectedQuestionId);
                if (i < 0) return null;
                const q = questions[i];
                return (
                  <View style={styles.flowEditPanel}>
                    <View style={styles.flowEditPanelHeader}>
                      <Text style={styles.flowEditPanelTitle}>Edit selected question</Text>
                      <TouchableOpacity onPress={() => setSelectedQuestionId(null)} hitSlop={8}>
                        <Ionicons name="close" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    <QuestionCard
                      question={q}
                      index={i}
                      previousQuestions={questions.slice(0, i)}
                      onChange={(updated) => setQuestions((prev) => prev.map((x, idx) => (idx === i ? updated : x)))}
                      onRemove={() => deleteQuestionById(q.id)}
                      onMoveUp={() => moveItem(questions, setQuestions, i, -1)}
                      onMoveDown={() => moveItem(questions, setQuestions, i, 1)}
                      readOnly={effectiveReadOnly}
                      isFirst={i === 0}
                      isLast={i === questions.length - 1}
                    />
                  </View>
                );
              })()
            ) : (
              <Text style={styles.flowSelectHint}>Tap a question node above to edit it.</Text>
            )}
          </>
        ) : isExperience ? (
          questions.map((q, i) => (
            <QuestionCard
              key={q.id || i}
              question={q}
              index={i}
              previousQuestions={questions.slice(0, i)}
              onChange={updated => setQuestions(prev => prev.map((x, idx) => idx === i ? updated : x))}
              onRemove={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveItem(questions, setQuestions, i, -1)}
              onMoveDown={() => moveItem(questions, setQuestions, i, 1)}
              readOnly={effectiveReadOnly}
              isFirst={i === 0}
              isLast={i === questions.length - 1}
            />
          ))
        ) : (
          skills.map((s, i) => (
            <SkillCard
              key={s.id || i}
              skill={s}
              index={i}
              onChange={updated => setSkills(prev => prev.map((x, idx) => idx === i ? updated : x))}
              onRemove={() => setSkills(prev => prev.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveItem(skills, setSkills, i, -1)}
              onMoveDown={() => moveItem(skills, setSkills, i, 1)}
              readOnly={effectiveReadOnly}
              isFirst={i === 0}
              isLast={i === skills.length - 1}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Template List Card ───────────────────────────────────────────────────────

function TemplateListCard({ item, onEdit, onDuplicate, onDelete, isDefault, canEditDefault }) {
  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.experience;
  const updated = item.updated_at
    ? new Date(item.updated_at).toLocaleDateString()
    : '—';

  return (
    <View style={styles.listCard}>
      {/* Icon */}
      <View style={[styles.listCardIcon, isDefault ? styles.listCardIconDefault : styles.listCardIconMine]}>
        <Ionicons
          name={isDefault ? 'lock-closed' : 'clipboard-outline'}
          size={18}
          color={isDefault ? '#6B7280' : '#6366F1'}
        />
      </View>

      <View style={styles.listCardLeft}>
        <Text style={styles.listCardName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.listCardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.listCardMeta}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg, borderColor: typeColor.border }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>{TYPE_LABELS[item.type]}</Text>
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="lock-closed" size={9} color="#D97706" style={{ marginRight: 3 }} />
              <Text style={styles.defaultBadgeText}>System default</Text>
            </View>
          )}
          {!isDefault && (
            <View style={styles.mineBadge}>
              <Ionicons name="person-outline" size={9} color="#7C3AED" style={{ marginRight: 3 }} />
              <Text style={styles.mineBadgeText}>Mine</Text>
            </View>
          )}
          <Text style={styles.listCardDate}>Updated {updated}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.listCardActions}>
        {/* Duplicate — always available */}
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onDuplicate(item)}>
          <Ionicons name="copy-outline" size={17} color="#6B7280" />
        </TouchableOpacity>
        {/* Edit — for user templates, or superadmin on default templates */}
        {(!isDefault || canEditDefault) && (
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => onEdit(item)}>
            <Ionicons name="pencil-outline" size={17} color="#6366F1" />
          </TouchableOpacity>
        )}
        {/* Delete — for user templates, or superadmin on default templates */}
        {(!isDefault || canEditDefault) && (
          <TouchableOpacity
            style={[styles.actionIconBtn, styles.actionIconBtnDanger]}
            onPress={() => {
              console.log('[TemplateListCard] 🗑 trash pressed → id:', item.id, 'isDefault:', isDefault, 'canEditDefault:', canEditDefault);
              onDelete(item);
            }}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AssessmentsPanel({ academyId, sessionRole, showNewTypePicker, setShowNewTypePicker }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loadingEditor, setLoadingEditor] = useState(false);

  // Superadmin (no academy, not manager/coach) can view and edit all global defaults.
  // Coaches and managers use their academyId (or null when they have no academy yet).
  const isReadOnly = false;
  const isSuperAdmin = !academyId && sessionRole !== 'manager' && sessionRole !== 'coach';
  console.log('[AssessmentsPanel] render → sessionRole:', sessionRole, 'academyId:', academyId, 'isSuperAdmin:', isSuperAdmin);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let data = await listAssessmentTemplates(academyId || null, { showAll: isSuperAdmin });

      // If a superadmin sees no default templates, seed them now.
      // This is a safety net for fresh databases or after a data wipe.
      if (isSuperAdmin && data.length === 0) {
        await seedDefaultTemplates();
        data = await listAssessmentTemplates(null, { showAll: true });
      }

      setTemplates(data);
    } catch (err) {
      console.warn('[AssessmentsPanel] load error:', err?.message);
      setLoadError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [academyId, isSuperAdmin]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // Fetch the full row (including template JSONB) before opening the editor.
  // The list query omits the template column for performance, so we must
  // fetch it here before mounting TemplateEditor — otherwise the editor
  // initializes its useState from an empty object and ignores saved customizations.
  const handleEdit = async (item) => {
    setLoadingEditor(true);
    try {
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', item.id)
        .single();
      if (!error && data) {
        setEditingTemplate(data);
      } else {
        // Fallback: open with whatever we have (defaults will show)
        setEditingTemplate({ ...item });
      }
    } catch {
      setEditingTemplate({ ...item });
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleDelete = (item) => {
    console.log('[AssessmentsPanel] handleDelete called → id:', item.id, 'name:', item.name, 'isSuperAdmin:', isSuperAdmin, 'academyId:', academyId, 'sessionRole:', sessionRole);

    const doDelete = async () => {
      console.log('[AssessmentsPanel] Delete confirmed → calling deleteAssessmentTemplate for id:', item.id);
      try {
        await deleteAssessmentTemplate(item.id);
        console.log('[AssessmentsPanel] ✅ deleteAssessmentTemplate resolved, reloading list');
        loadTemplates();
      } catch (err) {
        console.error('[AssessmentsPanel] ❌ deleteAssessmentTemplate threw:', err?.message, err);
        Alert.alert('Error', err?.message || 'Failed to delete.');
      }
    };

    // On web, Alert.alert buttons don't fire callbacks reliably — use window.confirm instead.
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
      console.log('[AssessmentsPanel] web confirm result:', ok);
      if (ok) doDelete();
      return;
    }

    Alert.alert(
      'Delete template',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  const handleDuplicate = async (item) => {
    try {
      // Fetch full template data first
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', item.id)
        .single();
      const source = (!error && data) ? data : item;
      await saveAssessmentTemplate({
        id: undefined, // always a new row
        type: source.type,
        name: `${source.name} (copy)`,
        description: source.description || '',
        template: source.template,
        academyId: academyId || null,
        isDefault: false, // duplicates are always user-owned, never system defaults
      });
      loadTemplates();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to duplicate.');
    }
  };

  const handleNewTemplate = (type) => {
    setShowNewTypePicker(false);
    console.log('[AssessmentsPanel] handleNewTemplate → type:', type, 'isSuperAdmin:', isSuperAdmin, 'academyId:', academyId, 'sessionRole:', sessionRole);
    const defaults = type === 'experience'
      ? DEFAULT_EXPERIENCE_TEMPLATE
      : DEFAULT_PLAYER_EVALUATION_TEMPLATE;
    setEditingTemplate({
      id: null,
      type,
      name: type === 'experience' ? 'Experience Assessment' : 'Player Assessment',
      description: '',
      template: defaults,
      is_default: false,  // always false for new templates; only superadmin system saves set this to true
      academy_id: academyId || null,
    });
  };

  if (loadingEditor) {
    return (
      <View style={styles.editorLoadingWrap}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading template…</Text>
      </View>
    );
  }

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onClose={() => { setEditingTemplate(null); loadTemplates(); }}
        onSaved={() => { setEditingTemplate(null); loadTemplates(); }}
        readOnly={isReadOnly}
        academyId={academyId}
        isSuperAdmin={isSuperAdmin}
      />
    );
  }

  return (
    <View style={styles.panelContainer}>
      {/* Panel header — title only, CTA is in AdminTopBar */}
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Assessment Templates</Text>
          <Text style={styles.panelSubtitle}>
            Edit the templates used for student assessments
          </Text>
        </View>
        {/* Type-picker dropdown — anchored here, triggered from AdminTopBar */}
        {showNewTypePicker && (
          <View style={styles.typePickerDropdown}>
            <TouchableOpacity style={styles.typePickerItem} onPress={() => handleNewTemplate('experience')}>
              <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.experience.bg, borderColor: TYPE_COLORS.experience.border }]}>
                <Text style={[styles.typeBadgeText, { color: TYPE_COLORS.experience.text }]}>First time</Text>
              </View>
              <Text style={styles.typePickerItemText}>First time questionnaire</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.typePickerItem} onPress={() => handleNewTemplate('player_evaluation')}>
              <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.player_evaluation.bg, borderColor: TYPE_COLORS.player_evaluation.border }]}>
                <Text style={[styles.typeBadgeText, { color: TYPE_COLORS.player_evaluation.text }]}>Player Evaluation</Text>
              </View>
              <Text style={styles.typePickerItemText}>Periodic Skill Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{templates.length}</Text>
          <Text style={styles.statLabel}>Total templates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{templates.filter(t => t.type === 'experience').length}</Text>
          <Text style={styles.statLabel}>First time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{templates.filter(t => t.type === 'player_evaluation').length}</Text>
          <Text style={styles.statLabel}>Player Eval</Text>
        </View>
      </View>

      {/* List */}
      <ScrollView style={styles.listScroll} contentContainerStyle={styles.listScrollContent}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading templates…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={[styles.emptyText, { color: '#EF4444' }]}>Failed to load templates</Text>
            <Text style={styles.emptySubText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadTemplates}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── System Defaults ── */}
            {(() => {
              const defaults = templates.filter(t => t.is_default && !t.academy_id);
              if (defaults.length === 0) return null;
              return (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="lock-closed-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.sectionHeaderText}>SYSTEM DEFAULTS</Text>
                  </View>
                  {defaults.map(item => (
                    <TemplateListCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      isDefault={true}
                      canEditDefault={isSuperAdmin}
                    />
                  ))}
                </>
              );
            })()}

            {/* ── Your Templates ── */}
            {(() => {
              const mine = templates.filter(t => !t.is_default || t.academy_id);
              return (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="person-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.sectionHeaderText}>YOUR TEMPLATES</Text>
                  </View>
                  {mine.length === 0 ? (
                    <View style={styles.emptySection}>
                      <Text style={styles.emptySectionText}>No custom templates yet. Create one with the "New template" button above.</Text>
                    </View>
                  ) : (
                    mine.map(item => (
                      <TemplateListCard
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        isDefault={false}
                      />
                    ))
                  )}
                </>
              );
            })()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Panel
  panelContainer: { flex: 1, backgroundColor: '#fafafa' },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    zIndex: 20,
    position: 'relative',
  },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  panelSubtitle: { fontSize: 13, color: '#71717a', marginTop: 2 },

  // Stats
  statsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    padding: Platform.OS === 'web' ? 14 : 10,
    alignItems: 'center',
  },
  statNumber: { fontSize: Platform.OS === 'web' ? 22 : 18, fontWeight: '700', color: '#18181b' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 2, textAlign: 'center' },

  typePickerDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    zIndex: 50,
    minWidth: 240,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }),
    elevation: 12,
  },
  typePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  typePickerItemText: { fontSize: 12, color: '#374151' },

  // List
  listScroll: { flex: 1 },
  listScrollContent: { padding: Platform.OS === 'web' ? 24 : 16, gap: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  emptySection: {
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  emptySectionText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listCardIconDefault: { backgroundColor: '#F3F4F6' },
  listCardIconMine: { backgroundColor: '#EEF2FF' },
  listCardLeft: { flex: 1, minWidth: 0 },
  listCardName: { fontSize: 15, fontWeight: '600', color: '#18181b', marginBottom: 4 },
  listCardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  listCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  listCardDate: { fontSize: 11, color: '#9CA3AF' },
  listCardActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  actionIconBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  // Badges
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  mineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  mineBadgeText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },

  // Loading / Empty
  loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  editorLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  overrideBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 8, margin: 12, marginBottom: 0, padding: 10 },
  overrideBannerText: { flex: 1, fontSize: 12, color: '#92400E', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 300 },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 9, backgroundColor: '#6366F1', borderRadius: 8 },
  retryBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Editor
  editorContainer: { flex: 1, backgroundColor: '#fafafa' },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  saveBtn: {
    marginLeft: 'auto',
    backgroundColor: '#18181b',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnCopy: { backgroundColor: '#7C3AED' },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  editorScroll: { flex: 1 },
  editorScrollContent: { padding: 20, paddingBottom: 60 },
  metaSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#18181b' },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  addItemBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e4e4e7',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#18181b', flex: 1 },
  cardSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  cardBody: { padding: 14 },
  iconBtn: { padding: 4 },

  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textInputMulti: { minHeight: 60, textAlignVertical: 'top' },
  inputDisabled: { backgroundColor: '#F9FAFB', color: '#9CA3AF' },

  // Condition editor
  conditionPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  conditionPanelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  conditionPanelHint: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  conditionModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  conditionModeChipActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  conditionModeChipDisabled: {
    opacity: 0.55,
  },
  conditionModeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  conditionModeChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  conditionModeChipTextDisabled: {
    color: '#9CA3AF',
  },
  conditionFirstNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  conditionBuilder: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  conditionStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  conditionChoiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChoiceChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? { maxWidth: 320 } : { flexGrow: 1, flexBasis: '100%' }),
  },
  conditionChoiceChipActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  conditionChoiceIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  conditionChoiceText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  conditionChoiceTextActive: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  conditionMatchChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  conditionMatchChipActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  conditionMatchChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  conditionMatchChipTextActive: {
    color: '#15803D',
    fontWeight: '600',
  },
  conditionMatchHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  conditionEmptyOpts: {
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  conditionWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  conditionWarnText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  conditionValueChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  conditionValueChipActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  conditionValueChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  conditionValueChipTextActive: {
    color: '#4338CA',
    fontWeight: '600',
  },
  conditionPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  conditionPreviewText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    lineHeight: 18,
  },
  conditionSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionSummaryText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  cardTitleCol: { flex: 1, minWidth: 0 },
  cardConditionHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Builder mode toggle (First-time only)
  builderToggleWrap: { marginTop: 14 },
  builderToggle: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  builderToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  builderToggleBtnActive: {
    backgroundColor: '#fff',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }),
  },
  builderToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717a',
  },
  builderToggleTextActive: {
    color: '#18181b',
    fontWeight: '700',
  },

  // Visual flowchart
  flowEditPanel: {
    marginTop: 4,
    marginBottom: 8,
  },
  flowEditPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flowEditPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  flowSelectHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
  },
  optionInputSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#9CA3AF',
    backgroundColor: '#fff',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier New',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  addOptionText: { fontSize: 13, color: '#6366F1', fontWeight: '500' },
  removeBtn: { padding: 2 },

  // Criteria
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  criterionHeaderText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  criterionLabel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
  },
  criterionScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  criterionScorePrefix: { fontSize: 14, color: '#9CA3AF' },
  criterionScoreInput: {
    width: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
});
