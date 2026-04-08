export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
};