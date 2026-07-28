/** Cool space palette — same family as Hero / Skills (cyan → blue → violet) */
export type ProjectTheme = {
  accent: string;
  glow: string;
  wash: string;
  line: string;
};

const THEMES: Record<string, ProjectTheme> = {
  talentista: {
    accent: '#7DD3FC',
    glow: 'rgba(125,211,252,0.2)',
    wash: 'radial-gradient(ellipse at 20% 25%, rgba(56,189,248,0.16) 0%, transparent 50%), radial-gradient(ellipse at 85% 75%, rgba(56,100,180,0.12) 0%, transparent 48%)',
    line: 'rgba(125,211,252,0.4)',
  },
  'saicon-2n250': {
    accent: '#A5B4FC',
    glow: 'rgba(165,180,252,0.18)',
    wash: 'radial-gradient(ellipse at 75% 30%, rgba(129,140,248,0.14) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(100,60,150,0.12) 0%, transparent 48%)',
    line: 'rgba(165,180,252,0.38)',
  },
  sn800: {
    accent: '#67E8F9',
    glow: 'rgba(103,232,249,0.16)',
    wash: 'radial-gradient(ellipse at 30% 70%, rgba(34,211,238,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 25%, rgba(56,100,180,0.12) 0%, transparent 48%)',
    line: 'rgba(103,232,249,0.38)',
  },
  portfolio: {
    accent: '#BAE6FD',
    glow: 'rgba(186,230,253,0.18)',
    wash: 'radial-gradient(ellipse at 50% 20%, rgba(125,211,252,0.16) 0%, transparent 52%), radial-gradient(ellipse at 15% 85%, rgba(99,102,241,0.12) 0%, transparent 48%)',
    line: 'rgba(186,230,253,0.4)',
  },
};

const FALLBACK: ProjectTheme = {
  accent: '#7DD3FC',
  glow: 'rgba(125,211,252,0.18)',
  wash: 'radial-gradient(ellipse at 40% 40%, rgba(56,100,180,0.14) 0%, transparent 55%)',
  line: 'rgba(125,211,252,0.35)',
};

export function getProjectTheme(id: string): ProjectTheme {
  return THEMES[id] ?? FALLBACK;
}
