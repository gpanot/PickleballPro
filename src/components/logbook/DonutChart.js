import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const SIZE = 88;
const STROKE = 15; // donut thickness
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end   = polarToCartesian(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export default function DonutChart({ tokens, monthSessionTypeHours, totalMonthHours }) {
  const total = totalMonthHours || 0;
  const isLight = tokens.bg !== '#0C0C0C';

  // Build segments from monthSessionTypeHours
  const entries = Object.entries(monthSessionTypeHours || {}).sort(([, a], [, b]) => b - a);
  const colors = tokens.donutColors;

  // If no data, show a placeholder ring
  const segments = [];
  if (total === 0 || entries.length === 0) {
    segments.push({ color: tokens.donutSecondaryFill, startDeg: 0, endDeg: 360 });
  } else {
    let currentAngle = 0;
    entries.forEach(([, hours], i) => {
      const sweep = (hours / total) * 360;
      segments.push({
        color: colors[i % colors.length] || colors[0],
        startDeg: currentAngle,
        endDeg: currentAngle + sweep,
      });
      currentAngle += sweep;
    });
  }

  return (
    <View style={{ width: SIZE, height: SIZE, position: 'relative', flexShrink: 0 }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke={isLight ? '#EDE6F6' : '#1E1E1E'}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          // Avoid full-circle arc (SVG path can't render 360°)
          const endDeg = seg.endDeg >= 360 ? 359.99 : seg.endDeg;
          return (
            <Path
              key={i}
              d={describeArc(CX, CY, RADIUS, seg.startDeg, endDeg)}
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
          );
        })}
      </Svg>
      {/* Center label */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        pointerEvents="none"
      >
        <Text style={{
          fontFamily: tokens.fontDisplay,
          fontSize: 18,
          fontWeight: '700',
          color: tokens.textPrimary,
          lineHeight: 22,
        }}>
          {total}h
        </Text>
      </View>
    </View>
  );
}
