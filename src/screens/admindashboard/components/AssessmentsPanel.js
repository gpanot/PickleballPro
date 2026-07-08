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
  DEFAULT_EXPERIENCE_TEMPLATE,
  DEFAULT_PLAYER_EVALUATION_TEMPLATE,
} from '../../../lib/assessmentTemplatesApi';
import { supabase } from '../../../lib/supabase';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const TYPE_LABELS = {
  experience: 'Experience',
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

function QuestionCard({ question, index, onChange, onRemove, onMoveUp, onMoveDown, readOnly, isFirst, isLast }) {
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

  const conditionStr = question.condition
    ? question.condition.mustExist
      ? `Show when "${question.condition.key}" exists and is not "${question.condition.notValue}"`
      : `Show when "${question.condition.key}" = "${question.condition.value}"`
    : 'Always shown';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIndex}>{index + 1}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{question.question || 'Untitled question'}</Text>
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

          {/* Condition (read-only display) */}
          <Text style={styles.fieldLabel}>Condition</Text>
          <View style={styles.conditionBadge}>
            <Ionicons name="git-branch-outline" size={13} color="#6B7280" />
            <Text style={styles.conditionText}>{conditionStr}</Text>
          </View>

          {/* Options */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Options</Text>
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

function TemplateEditor({ template, onClose, onSaved, readOnly, academyId }) {
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

  const moveItem = (list, setList, i, dir) => {
    const next = [...list];
    const swapIdx = i + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[i], next[swapIdx]] = [next[swapIdx], next[i]];
    setList(next);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: uid(),
        question: '',
        type: 'button',
        condition: null,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    ]);
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
      // If a manager is editing the global default, create a new academy-scoped
      // copy rather than overwriting the shared default (which would break other
      // academies).
      const isGlobalDefault = template.is_default && !template.academy_id;
      const creatingAcademyOverride = isGlobalDefault && !!academyId;

      const payload = {
        id: creatingAcademyOverride ? undefined : template.id,
        type: template.type,
        name: name.trim(),
        description: description.trim(),
        template: isExperience ? { questions } : { skills },
        academyId: academyId || null,
      };
      await saveAssessmentTemplate(payload);
      onSaved();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = TYPE_COLORS[template.type] || TYPE_COLORS.experience;
  const isGlobalDefault = template.is_default && !template.academy_id;
  const showOverrideBanner = isGlobalDefault && !!academyId && !readOnly;

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
        {!readOnly && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {showOverrideBanner && (
        <View style={styles.overrideBanner}>
          <Ionicons name="information-circle-outline" size={15} color="#92400E" />
          <Text style={styles.overrideBannerText}>
            Saving will create an academy-specific copy — the global default will not be modified.
          </Text>
        </View>
      )}

      <ScrollView style={styles.editorScroll} contentContainerStyle={[styles.editorScrollContent, { paddingBottom: Math.max(60, insets.bottom + 40) }]}>
        {/* Meta fields */}
        <View style={styles.metaSection}>
          <Text style={styles.fieldLabel}>Template name</Text>
          <TextInput
            style={[styles.textInput, readOnly && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Player Assessment"
            editable={!readOnly}
          />
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMulti, readOnly && styles.inputDisabled]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            editable={!readOnly}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Items section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {isExperience ? `Questions (${questions.length})` : `Skills (${skills.length})`}
          </Text>
          {!readOnly && (
            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={isExperience ? addQuestion : addSkill}
            >
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={styles.addItemBtnText}>{isExperience ? 'Add question' : 'Add skill'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isExperience
          ? questions.map((q, i) => (
              <QuestionCard
                key={q.id || i}
                question={q}
                index={i}
                onChange={updated => setQuestions(prev => prev.map((x, idx) => idx === i ? updated : x))}
                onRemove={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))}
                onMoveUp={() => moveItem(questions, setQuestions, i, -1)}
                onMoveDown={() => moveItem(questions, setQuestions, i, 1)}
                readOnly={readOnly}
                isFirst={i === 0}
                isLast={i === questions.length - 1}
              />
            ))
          : skills.map((s, i) => (
              <SkillCard
                key={s.id || i}
                skill={s}
                index={i}
                onChange={updated => setSkills(prev => prev.map((x, idx) => idx === i ? updated : x))}
                onRemove={() => setSkills(prev => prev.filter((_, idx) => idx !== i))}
                onMoveUp={() => moveItem(skills, setSkills, i, -1)}
                onMoveDown={() => moveItem(skills, setSkills, i, 1)}
                readOnly={readOnly}
                isFirst={i === 0}
                isLast={i === skills.length - 1}
              />
            ))
        }
      </ScrollView>
    </View>
  );
}

// ─── Template List Card ───────────────────────────────────────────────────────

function TemplateListCard({ item, onEdit, onDelete, readOnly }) {
  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.experience;
  const updated = item.updated_at
    ? new Date(item.updated_at).toLocaleDateString()
    : '—';

  return (
    <View style={styles.listCard}>
      <View style={styles.listCardLeft}>
        <Text style={styles.listCardName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.listCardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.listCardMeta}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg, borderColor: typeColor.border }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>{TYPE_LABELS[item.type]}</Text>
          </View>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
          <Text style={styles.listCardDate}>Updated {updated}</Text>
        </View>
      </View>
      <View style={styles.listCardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Ionicons name="pencil-outline" size={15} color="#6366F1" />
          <Text style={styles.editBtnText}>{readOnly ? 'View' : 'Edit'}</Text>
        </TouchableOpacity>
        {!readOnly && !item.is_default && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AssessmentsPanel({ academyId, sessionRole }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [showNewTypePicker, setShowNewTypePicker] = useState(false);

  const isReadOnly = sessionRole === 'coach';
  // Superadmin (no academy scope, not coach/manager) sees all templates
  const isSuperAdmin = !academyId && sessionRole !== 'coach' && sessionRole !== 'manager';

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listAssessmentTemplates(academyId || null, { showAll: isSuperAdmin });
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
    Alert.alert(
      'Delete template',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssessmentTemplate(item.id);
              loadTemplates();
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const handleNewTemplate = (type) => {
    setShowNewTypePicker(false);
    const defaults = type === 'experience'
      ? DEFAULT_EXPERIENCE_TEMPLATE
      : DEFAULT_PLAYER_EVALUATION_TEMPLATE;
    setEditingTemplate({
      id: null,
      type,
      name: type === 'experience' ? 'Experience Assessment' : 'Player Assessment',
      description: '',
      template: defaults,
      is_default: false,
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
      />
    );
  }

  return (
    <View style={styles.panelContainer}>
      {/* Panel header */}
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Assessment Templates</Text>
          <Text style={styles.panelSubtitle}>
            Edit the templates used for student assessments
          </Text>
        </View>
        {!isReadOnly && (
          <View style={styles.newBtnWrap}>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => setShowNewTypePicker(v => !v)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.newBtnText}>New template</Text>
            </TouchableOpacity>
            {showNewTypePicker && (
              <View style={styles.typePickerDropdown}>
                <TouchableOpacity style={styles.typePickerItem} onPress={() => handleNewTemplate('experience')}>
                  <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.experience.bg, borderColor: TYPE_COLORS.experience.border }]}>
                    <Text style={[styles.typeBadgeText, { color: TYPE_COLORS.experience.text }]}>Experience</Text>
                  </View>
                  <Text style={styles.typePickerItemText}>Branching questionnaire</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.typePickerItem} onPress={() => handleNewTemplate('player_evaluation')}>
                  <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS.player_evaluation.bg, borderColor: TYPE_COLORS.player_evaluation.border }]}>
                    <Text style={[styles.typeBadgeText, { color: TYPE_COLORS.player_evaluation.text }]}>Player Evaluation</Text>
                  </View>
                  <Text style={styles.typePickerItemText}>Scored skill assessment</Text>
                </TouchableOpacity>
              </View>
            )}
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
          <Text style={styles.statLabel}>Experience</Text>
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
        ) : templates.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="clipboard-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubText}>Create one with the "New template" button above.</Text>
          </View>
        ) : (
          templates.map(item => (
            <TemplateListCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              readOnly={isReadOnly}
            />
          ))
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  panelSubtitle: { fontSize: 13, color: '#71717a', marginTop: 2 },

  // Stats
  statsStrip: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#18181b' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 2 },

  // New button
  newBtnWrap: { position: 'relative' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  newBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  typePickerDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    zIndex: 100,
    minWidth: 220,
    ...(Platform.OS === 'web' && { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }),
    elevation: 8,
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
  listScrollContent: { padding: 24, gap: 12 },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listCardLeft: { flex: 1 },
  listCardName: { fontSize: 15, fontWeight: '600', color: '#18181b', marginBottom: 4 },
  listCardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  listCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listCardDate: { fontSize: 11, color: '#9CA3AF' },
  listCardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editBtnText: { fontSize: 13, fontWeight: '500', color: '#6366F1' },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 7,
    borderWidth: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#D97706' },

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

  // Condition badge
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  conditionText: { fontSize: 12, color: '#6B7280', flex: 1 },

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
