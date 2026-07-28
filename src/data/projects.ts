export type ProjectItem = {
  id: string;
  title: string;
  eyebrow: string;
  period?: string;
  description: string;
  highlights: string[];
  tags: string[];
  projectUrl?: string;
  repoUrl?: string;
};

export function isProjectItem(value: unknown): value is ProjectItem {
  if (!value || typeof value !== 'object') return false;
  const p = value as ProjectItem;
  return typeof p.id === 'string' && typeof p.title === 'string' && Array.isArray(p.highlights);
}
