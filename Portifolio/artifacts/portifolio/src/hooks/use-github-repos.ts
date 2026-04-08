import { useMemo } from 'react';
import { useGetGithubRepos } from '@workspace/api-client-react';
import type { GithubRepo } from '@/types/github';

export function useFilteredGithubRepos(username: string) {
  const query = useGetGithubRepos({ username });

  const filteredRepos = useMemo<GithubRepo[]>(() => {
    const repos = Array.isArray(query.data) ? (query.data as GithubRepo[]) : [];

    return repos
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
  }, [query.data]);

  return {
    ...query,
    data: filteredRepos,
  };
}    