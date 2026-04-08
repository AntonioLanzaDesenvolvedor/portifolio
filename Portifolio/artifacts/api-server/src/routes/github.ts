import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/github/repos", async (req, res) => {
  const { username } = req.query;

  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "username query parameter is required" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "developer-portfolio-app",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      req.log.warn({ status: response.status, username }, "GitHub API error");
      res.status(response.status).json({ error: `GitHub API error: ${errorText}` });
      return;
    }

    const repos = await response.json();
    res.json(repos);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch GitHub repos");
    res.status(500).json({ error: "Failed to fetch GitHub repositories" });
  }
});

export default router;