/**
 * VisualFlowChart — standalone component for First-time assessment branching.
 *
 * Layout strategy: we build a logical tree, compute per-node widths via a
 * post-order subtree-width pass, then assign (x, y) positions in a top-down
 * pre-order pass. Everything is rendered with absolute positioning inside a
 * ScrollView so the canvas can scroll both horizontally and vertically.
 *
 * Connector lines are drawn as thin View strips (no SVG/canvas dependency).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Layout constants ────────────────────────────────────────────────────────
const NODE_W = 200;    // question card width
const NODE_H = 80;     // question card height (approx, content can overflow)
const START_W = 100;
const START_H = 44;
const END_W = 72;
const END_H = 36;
const PILL_W = 100;
const PILL_H = 30;
const COL_GAP = 32;    // horizontal gap between sibling subtrees
const ROW_GAP = 28;    // vertical gap between rows

// y offsets between rows:
const Y_NODE_TO_PILL = NODE_H + ROW_GAP;      // node bottom → pill top
const Y_PILL_TO_NEXT = PILL_H + ROW_GAP;      // pill bottom → next node/end top
const ROW_H_BRANCH = NODE_H + ROW_GAP + PILL_H + ROW_GAP; // one level of branching height

// ─── Branch colours ──────────────────────────────────────────────────────────
const PILL_COLORS = [
  { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' },
  { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
];

// ─── Tree data helpers ───────────────────────────────────────────────────────

function getChildrenForOption(questions, parentId, optValue) {
  return questions.filter((q) => {
    const c = q.condition;
    if (!c || c.key !== parentId) return false;
    if (c.mustExist) return optValue !== c.notValue;
    return c.value === optValue;
  });
}

/** Build a recursive tree object from flat questions array. */
function buildTree(questions, rootQuestion, seenIds = new Set()) {
  if (seenIds.has(rootQuestion.id)) return null; // cycle guard
  const next = new Set(seenIds);
  next.add(rootQuestion.id);

  const opts = rootQuestion.options || [];
  const branches = opts.map((opt, oi) => {
    const children = getChildrenForOption(questions, rootQuestion.id, opt.value)
      .map((q) => buildTree(questions, q, next))
      .filter(Boolean);
    return { opt, children, colorIndex: oi };
  });

  return { question: rootQuestion, branches };
}

/** Compute the minimum pixel width a subtree needs. */
function subtreeWidth(node) {
  if (!node) return END_W;
  const branchWidths = node.branches.map((b) => {
    const childrenW = b.children.length
      ? b.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
        (b.children.length - 1) * COL_GAP
      : END_W;
    return Math.max(PILL_W, childrenW);
  });
  if (branchWidths.length === 0) return Math.max(NODE_W, END_W);
  const total =
    branchWidths.reduce((s, w) => s + w, 0) + (branchWidths.length - 1) * COL_GAP;
  return Math.max(NODE_W, total);
}

/** Recursively place nodes, returning an array of { type, x, y, … } objects. */
function layoutTree(node, cx, baseY, elements) {
  if (!node) return;

  // Question node — centred at cx
  const qX = cx - NODE_W / 2;
  const qY = baseY;
  elements.push({ type: 'question', node, x: qX, y: qY });

  if (node.branches.length === 0) {
    // No options → END directly below
    const endY = qY + Y_NODE_TO_PILL;
    elements.push({
      type: 'end',
      x: cx - END_W / 2,
      y: endY,
      cx,
      fromY: qY + NODE_H,
    });
    elements.push({
      type: 'vline',
      x: cx,
      y: qY + NODE_H,
      height: ROW_GAP,
    });
    return;
  }

  // Vertical stem from node bottom to horizontal spreader
  const stemTopY = qY + NODE_H;
  const pillerY = qY + Y_NODE_TO_PILL; // pill row top y

  // Compute per-branch widths and their x positions
  const bWidths = node.branches.map((b) => {
    const childrenW = b.children.length
      ? b.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
        (b.children.length - 1) * COL_GAP
      : END_W;
    return Math.max(PILL_W, childrenW);
  });

  const totalW =
    bWidths.reduce((s, w) => s + w, 0) + (bWidths.length - 1) * COL_GAP;

  // Left edge of branch spread
  let cursor = cx - totalW / 2;
  const branchCenters = bWidths.map((w) => {
    const bcx = cursor + w / 2;
    cursor += w + COL_GAP;
    return bcx;
  });

  // Short vertical stem from question node to horizontal connector line
  elements.push({ type: 'vline', x: cx, y: stemTopY, height: ROW_GAP / 2 });

  // Horizontal connector line across all branches (if more than 1 branch)
  if (branchCenters.length > 1) {
    const leftX = branchCenters[0];
    const rightX = branchCenters[branchCenters.length - 1];
    const hLineY = stemTopY + ROW_GAP / 2;
    elements.push({ type: 'hline', x: leftX, y: hLineY, width: rightX - leftX });
  }

  const hLineY = stemTopY + ROW_GAP / 2;

  // Per-branch: vertical drop from h-line to pill, then pill, then children
  node.branches.forEach((branch, bi) => {
    const bcx = branchCenters[bi];
    const color = PILL_COLORS[branch.colorIndex % PILL_COLORS.length];

    // Vertical from h-line to pill
    const prePillY = hLineY;
    const prePillH = pillerY - prePillY;
    elements.push({ type: 'vline', x: bcx, y: prePillY, height: prePillH });

    // Pill
    elements.push({
      type: 'pill',
      x: bcx - PILL_W / 2,
      y: pillerY,
      cx: bcx,
      color,
      label:
        branch.opt.label?.trim() ||
        branch.opt.value ||
        `Option ${bi + 1}`,
    });

    const belowPillY = pillerY + PILL_H;
    const childTopY = belowPillY + ROW_GAP;

    if (branch.children.length > 0) {
      // Vertical from pill to child
      elements.push({
        type: 'vline',
        x: bcx,
        y: belowPillY,
        height: ROW_GAP,
      });
      branch.children.forEach((child) => layoutTree(child, bcx, childTopY, elements));
    } else {
      // END node
      elements.push({ type: 'vline', x: bcx, y: belowPillY, height: ROW_GAP });
      elements.push({
        type: 'end',
        x: bcx - END_W / 2,
        y: childTopY,
        cx: bcx,
        fromY: belowPillY,
      });
    }
  });
}

/** Compute total canvas dimensions from elements. */
function canvasBounds(elements) {
  let maxX = 0;
  let maxY = 0;
  elements.forEach((el) => {
    const w =
      el.type === 'question'
        ? NODE_W
        : el.type === 'pill'
        ? PILL_W
        : el.type === 'end'
        ? END_W
        : el.type === 'hline'
        ? el.width
        : 2;
    const h =
      el.type === 'question'
        ? NODE_H
        : el.type === 'pill'
        ? PILL_H
        : el.type === 'end'
        ? END_H
        : el.type === 'vline'
        ? el.height
        : 2;
    maxX = Math.max(maxX, (el.x || 0) + w);
    maxY = Math.max(maxY, (el.y || 0) + h);
  });
  return { width: maxX, height: maxY };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisualFlowChart({
  questions = [],
  selectedId,
  onSelect,
  onDuplicate,
  onDelete,
  readOnly = false,
}) {
  const PADDING = 32;

  // Build trees from root questions (no condition)
  const roots = questions.filter((q) => !q.condition);

  // Detect orphans (condition set but not reachable)
  const reachable = new Set();
  const walkReachable = (q) => {
    if (!q?.id || reachable.has(q.id)) return;
    reachable.add(q.id);
    (q.options || []).forEach((opt) =>
      getChildrenForOption(questions, q.id, opt.value).forEach(walkReachable)
    );
  };
  roots.forEach(walkReachable);
  const orphans = questions.filter((q) => q.condition && !reachable.has(q.id));

  // Compute layout
  const elements = [];
  const START_CY = PADDING + START_H / 2;

  // Start node
  elements.push({
    type: 'start',
    x: 0, // will centre after we know total width
    y: PADDING,
  });

  const questionBaseY = PADDING + START_H + ROW_GAP;

  if (roots.length === 0) {
    // nothing to render
  } else {
    // Compute total width of all root subtrees placed side-by-side
    const rootWidths = roots.map((r) => subtreeWidth(buildTree(questions, r)));
    const totalRootsW =
      rootWidths.reduce((s, w) => s + w, 0) + (roots.length - 1) * COL_GAP;

    let rootCursor = PADDING;
    roots.forEach((r, ri) => {
      const tree = buildTree(questions, r);
      const rcx = rootCursor + rootWidths[ri] / 2;
      layoutTree(tree, rcx, questionBaseY, elements);
      rootCursor += rootWidths[ri] + COL_GAP;
    });

    // Vertical stem from start to first question row
    const startCX = PADDING + totalRootsW / 2;
    // Overwrite start x
    const startEl = elements.find((e) => e.type === 'start');
    if (startEl) startEl.x = startCX - START_W / 2;

    elements.push({
      type: 'vline',
      x: startCX,
      y: PADDING + START_H,
      height: ROW_GAP,
    });
  }

  const { width: rawW, height: rawH } = canvasBounds(elements);
  const canvasW = rawW + PADDING;
  const canvasH = rawH + PADDING;

  const renderElement = (el, idx) => {
    switch (el.type) {
      case 'start':
        return (
          <View
            key={`start-${idx}`}
            style={[fstyles.startNode, { left: el.x, top: el.y, width: START_W }]}
          >
            <Ionicons name="play-circle" size={15} color="#EA580C" />
            <Text style={fstyles.startText}>Start</Text>
          </View>
        );

      case 'question': {
        const q = el.node.question;
        const qIdx = questions.findIndex((x) => x.id === q.id);
        const selected = selectedId === q.id;
        return (
          <View
            key={`q-${q.id}-${idx}`}
            style={[
              fstyles.questionNode,
              { left: el.x, top: el.y, width: NODE_W },
              selected && fstyles.questionNodeSelected,
            ]}
          >
            <TouchableOpacity
              style={fstyles.questionTouchable}
              onPress={() => onSelect && onSelect(q.id)}
              activeOpacity={0.8}
            >
              <View style={fstyles.questionBadge}>
                <Text style={fstyles.questionBadgeText}>
                  {qIdx >= 0 ? qIdx + 1 : '?'}
                </Text>
              </View>
              <Text style={fstyles.questionText} numberOfLines={3}>
                {q.question?.trim() || 'Untitled question'}
              </Text>
            </TouchableOpacity>

            {selected && !readOnly && (
              <View style={fstyles.nodeActions}>
                <TouchableOpacity
                  style={fstyles.actionBtn}
                  onPress={() => onSelect && onSelect(q.id)}
                >
                  <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                </TouchableOpacity>
                <View style={fstyles.actionDivider} />
                <TouchableOpacity
                  style={fstyles.actionBtn}
                  onPress={() => onDuplicate && onDuplicate(q.id)}
                >
                  <Ionicons name="copy-outline" size={14} color="#2563EB" />
                </TouchableOpacity>
                <View style={fstyles.actionDivider} />
                <TouchableOpacity
                  style={fstyles.actionBtn}
                  onPress={() => onDelete && onDelete(q.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }

      case 'pill': {
        const c = el.color;
        return (
          <View
            key={`pill-${idx}`}
            style={[
              fstyles.pill,
              {
                left: el.x,
                top: el.y,
                width: PILL_W,
                backgroundColor: c.bg,
                borderColor: c.border,
              },
            ]}
          >
            <Text style={[fstyles.pillText, { color: c.text }]} numberOfLines={2}>
              {el.label}
            </Text>
          </View>
        );
      }

      case 'end':
        return (
          <View
            key={`end-${idx}`}
            style={[fstyles.endNode, { left: el.x, top: el.y, width: END_W }]}
          >
            <Text style={fstyles.endText}>END</Text>
          </View>
        );

      case 'vline':
        return (
          <View
            key={`vl-${idx}`}
            style={[
              fstyles.vline,
              {
                left: el.x - 1,
                top: el.y,
                height: Math.max(1, el.height),
              },
            ]}
          />
        );

      case 'hline':
        return (
          <View
            key={`hl-${idx}`}
            style={[
              fstyles.hline,
              {
                left: el.x,
                top: el.y - 1,
                width: Math.max(1, el.width),
              },
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={fstyles.outer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ minWidth: canvasW }}
      >
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={{ minHeight: canvasH }}
        >
          <View style={{ width: canvasW, height: canvasH }}>
            {elements.map(renderElement)}
          </View>

          {orphans.length > 0 && (
            <View style={fstyles.orphansWrap}>
              <View style={fstyles.orphansHeader}>
                <Ionicons name="warning-outline" size={13} color="#B45309" />
                <Text style={fstyles.orphansTitle}>Unlinked questions</Text>
              </View>
              <Text style={fstyles.orphansHint}>
                These conditions point to answers not reachable from the flow above.
                Tap to edit or fix the condition in Linear view.
              </Text>
              <View style={fstyles.orphansList}>
                {orphans.map((q) => {
                  const qi = questions.findIndex((x) => x.id === q.id);
                  const sel = selectedId === q.id;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[fstyles.orphanCard, sel && fstyles.orphanCardSelected]}
                      onPress={() => onSelect && onSelect(q.id)}
                      activeOpacity={0.8}
                    >
                      <View style={fstyles.questionBadge}>
                        <Text style={fstyles.questionBadgeText}>{qi + 1}</Text>
                      </View>
                      <Text style={fstyles.orphanText} numberOfLines={2}>
                        {q.question?.trim() || 'Untitled question'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const LINE_COLOR = '#CBD5E1';

const fstyles = StyleSheet.create({
  outer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 360,
    maxHeight: 560,
    overflow: 'hidden',
    marginBottom: 10,
  },

  // Start node
  startNode: {
    position: 'absolute',
    height: START_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 999,
  },
  startText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.3,
  },

  // Question node
  questionNode: {
    position: 'absolute',
    minHeight: NODE_H,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 10px rgba(15,23,42,0.07)' }
      : {
          shadowColor: '#0F172A',
          shadowOpacity: 0.07,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }),
  },
  questionNodeSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  questionTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  questionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  questionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    lineHeight: 14,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },

  // Node actions (shown when selected)
  nodeActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EFF6FF',
    backgroundColor: '#F8FAFF',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#EFF6FF',
    marginVertical: 6,
  },

  // Answer pill
  pill: {
    position: 'absolute',
    height: PILL_H,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },

  // END node
  endNode: {
    position: 'absolute',
    height: END_H,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },

  // Connector lines
  vline: {
    position: 'absolute',
    width: 2,
    backgroundColor: LINE_COLOR,
  },
  hline: {
    position: 'absolute',
    height: 2,
    backgroundColor: LINE_COLOR,
  },

  // Orphans section
  orphansWrap: {
    margin: 16,
    padding: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  orphansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orphansTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  orphansHint: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 17,
    marginBottom: 10,
  },
  orphansList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orphanCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderStyle: 'dashed',
    padding: 10,
    maxWidth: 200,
  },
  orphanCardSelected: {
    borderColor: '#3B82F6',
    borderStyle: 'solid',
  },
  orphanText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 17,
  },
});
