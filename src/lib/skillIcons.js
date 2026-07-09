/**
 * Lucide icon mapping for canonical skill IDs.
 * Use SkillIcon / SkillIconBadge components — never render skill.emoji in UI.
 */
import {
  ArrowLeftRight,
  ArrowUp,
  Bird,
  CircleDot,
  CornerDownLeft,
  Crosshair,
  Dumbbell,
  Droplets,
  EyeOff,
  Flame,
  Footprints,
  Gamepad2,
  Gem,
  Hash,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Puzzle,
  RefreshCw,
  RotateCw,
  Shield,
  Target,
  Wind,
  Zap,
} from 'lucide-react-native';

/** @type {Record<string, import('react').ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>} */
export const SKILL_ICON_MAP = {
  dinks: CircleDot,
  drives: Zap,
  serves: Target,
  returns: CornerDownLeft,
  volleys: Shield,
  lobs: ArrowUp,
  drops: Droplets,
  resets: RefreshCw,
  third_shot: Hash,
  smashes: Flame,
  slices: Wind,
  spin_control: Wind,
  rolls: RotateCw,
  flicks: Zap,
  putaways: Target,
  defensive_saves: LifeBuoy,
  erne: Bird,
  atp: RotateCw,
  footwork: Footprints,
  positioning: MapPin,
  transitions: ArrowLeftRight,
  game_play: Gamepad2,
  patterns: Puzzle,
  communication: MessageCircle,
  pressure_points: Gem,
  poaching: Crosshair,
  disguise: EyeOff,
  conditioning: Dumbbell,
  general: Target,
};

export function getSkillIconComponent(skillId, sportId) {
  // sportId is reserved for future per-sport icon maps; currently all sports
  // share the same Lucide mapping since only pickleball is supported.
  return SKILL_ICON_MAP[skillId] || CircleDot;
}
