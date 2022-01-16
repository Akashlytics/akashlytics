import { Octokit } from "@octokit/rest";

export const fetchGithubReleases = async () => {
  const githubPAT = process.env.AkashlyticsGithubPAT;

  if (!githubPAT) {
    throw new Error("AkashlyticsGithubPAT is missing");
  }

  const octokit = new Octokit({
    auth: githubPAT,
    userAgent: "Akashlytics API",
    baseUrl: "https://api.github.com"
  });

  const response = await octokit.rest.repos.getLatestRelease({
    owner: "Akashlytics",
    repo: "akashlytics-deploy"
  });

  if (response.status !== 200) {
    throw new Error("Failed to fetch latest version from github");
  }

  console.log("Fetched latest deploy tool version from github: " + response.data.tag_name);
  console.log(response.headers["x-ratelimit-remaining"] + " queries remining.");

  const latestRelease = response.data;

  const windowsAsset = latestRelease.assets.find((x) => x.state === "uploaded" && x.name.endsWith(".exe"));
  const macAsset = latestRelease.assets.find((x) => x.state === "uploaded" && x.name.endsWith(".dmg"));
  const linuxAsset = latestRelease.assets.find((x) => x.state === "uploaded" && x.name.endsWith(".AppImage"));

  const releaseData = {
    version: latestRelease.tag_name,
    note: latestRelease.body,
    windowsUrl: windowsAsset?.browser_download_url,
    macUrl: macAsset?.browser_download_url,
    linuxUrl: linuxAsset?.browser_download_url
  };

  return releaseData;
};
