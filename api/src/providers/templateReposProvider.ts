import fetch from "node-fetch";
import removeMarkdown from "markdown-to-text";
import path from "path";
import { getOctokit } from "./githubProvider";
import { isUrlAbsolute } from "@src/shared/utils/urls";
import * as fs from "fs";
import { Octokit } from "@octokit/rest";
import { getLogoFromPath } from "./templateReposLogos";

let generatingTask = null;
let lastServedData = null;

async function getTemplatesFromRepo(octokit: Octokit, repoOwner: string, repoName: string, fetcher: (ocktokit, version) => Promise<any>) {
  const repoVersion = await fetchRepoVersion(octokit, repoOwner, repoName);
  const cacheFilePath = `data/templates/${repoOwner}-${repoName}-${repoVersion}.json`;
  let categories = null;

  if (fs.existsSync(cacheFilePath)) {
    const fileContent = fs.readFileSync(cacheFilePath, "utf8");
    categories = JSON.parse(fileContent);
  } else {
    categories = await fetcher(octokit, repoVersion);
    await fs.promises.mkdir(path.dirname(cacheFilePath), { recursive: true });
    await fs.promises.writeFile(cacheFilePath, JSON.stringify(categories, null, 2));
  }

  return categories;
}

function mergeTemplateCategories(...categories: any[]) {
  let mergedCategories = [];
  for (const category of categories.flat()) {
    const existingCategory = mergedCategories.find((c) => c.title === category.title);
    if (existingCategory) {
      existingCategory.templates = (existingCategory.templates || []).concat(category.templates);
    } else {
      mergedCategories.push(category);
    }
  }

  return mergedCategories;
}

export const getTemplateGallery = async () => {
  try {
    const octokit = getOctokit();

    const awesomeAkashTemplates = await getTemplatesFromRepo(octokit, "ovrclk", "awesome-akash", fetchAwesomeAkashTemplates);
    const omnibusTemplates = await getTemplatesFromRepo(octokit, "ovrclk", "cosmos-omnibus", fetchOmnibusTemplates);

    const templateGallery = mergeTemplateCategories(omnibusTemplates, awesomeAkashTemplates);

    lastServedData = templateGallery;

    return templateGallery;
  } catch (err) {
    if (lastServedData) {
      console.error(err);
      console.log("Serving template gallery from last working version");
      return lastServedData;
    } else {
      throw err;
    }
  }
};

// Fetch latest version of a repo
export const fetchRepoVersion = async (octokit: Octokit, owner: string, repo: string) => {
  const response = await octokit.rest.repos.getBranch({
    owner: owner,
    repo: repo,
    branch: "master"
  });

  const reqRemaining = response.headers["x-ratelimit-remaining"];
  console.log(`${reqRemaining} requests remaining`);

  if (response.status !== 200) {
    throw new Error(`Failed to fetch latest version of ${owner}/${repo} from github`);
  }

  return response.data.commit.sha;
};

// Fetch templates from the cosmos-omnibus repo
async function fetchOmnibusTemplates(octokit: Octokit, repoVersion: string) {
  const response = await octokit.rest.repos.getContent({
    owner: "ovrclk",
    repo: "cosmos-omnibus",
    ref: repoVersion,
    path: null,
    mediaType: {
      format: "raw"
    }
  });

  if (!(response.data instanceof Array)) throw "Counld not fetch list of files from ovrclk/cosmos-omnibus";

  const folders = response.data.filter((f) => f.type === "dir" && !f.name.startsWith(".") && !f.name.startsWith("_"));
  const templates = folders.map((x) => ({
    name: x.name,
    path: x.path,
    logoUrl: null,
    summary:
      "This is a meta package of cosmos-sdk-based docker images and configuration meant to make deploying onto Akash easy and standardized across cosmos.",
    repoName: "cosmos-omnibus",
    repoOwner: "ovrclk",
    repoVersion: repoVersion
  }));

  for (const template of templates) {
    try {
      const assetListResponse = await fetch(`https://raw.githubusercontent.com/cosmos/chain-registry/master/${template.path}/assetlist.json`);

      if (assetListResponse.status !== 200) throw "Could not fetch assetlist.json";

      const assetList = await assetListResponse.json();
      if (assetList.assets.length === 0) {
        throw "No asset found";
      } else if (assetList.assets.length > 1) {
        throw "More than one asset found";
      }

      const asset = assetList.assets[0];
      template.name = asset.name;
      template.summary = asset.description;
      template.logoUrl = Object.values(asset.logo_URIs)[0];
    } catch (err) {
      console.log("Could not fetch assetlist for", template.path);
      console.error(err);
    }
  }

  const categories = [
    {
      title: "Blockchain",
      templates: templates
    }
  ];

  return await fetchTemplatesInfo(octokit, categories);
}

// Fetch templates from the Awesome-Akash repo
async function fetchAwesomeAkashTemplates(octokit: Octokit, repoVersion: string) {
  // Fetch list of templates from README.md
  const response = await octokit.rest.repos.getContent({
    owner: "ovrclk",
    repo: "awesome-akash",
    path: "README.md",
    ref: repoVersion,
    mediaType: {
      format: "raw"
    }
  });

  if (response.status !== 200) throw Error("Invalid response code: " + response.status);

  let reqRemaining = response.headers["x-ratelimit-remaining"];
  const data = String(response.data);

  const categoryRegex = /### (.+)\n*([\w ]+)?\n*((?:- \[(?:.+)]\((?:.+)\)\n?)*)/gm;
  const templateRegex = /(- \[(.+)]\((.+)\)\n?)/gm;

  let categories = [];

  // Looping through categories
  const matches = data.matchAll(categoryRegex);
  for (const match of matches) {
    const title = match[1];
    const description = match[2];
    const templatesStr = match[3];

    // Ignore duplicate categories
    if (categories.some((x) => x.title === title)) {
      continue;
    }

    // Extracting templates
    const templates = [];
    if (templatesStr) {
      const templateMatches = templatesStr.matchAll(templateRegex);
      for (const templateMatch of templateMatches) {
        templates.push({
          name: templateMatch[2],
          path: templateMatch[3],
          repoOwner: "ovrclk",
          repoName: "awesome-akash",
          repoVersion: repoVersion
        });
      }
    }

    categories.push({
      title: title,
      description: description,
      templates: templates
    });
  }

  return await fetchTemplatesInfo(octokit, categories);
}

export async function fetchTemplatesInfo(octokit: Octokit, categories) {
  for (const category of categories) {
    for (const template of category.templates) {
      try {
        // Ignoring templates that are not in the awesome-akash repo
        if (template.path.startsWith("http:") || template.path.startsWith("https:")) {
          throw "Absolute URL";
        }

        // Fetching file list in template folder
        const response = await octokit.rest.repos.getContent({
          repo: template.repoName,
          owner: template.repoOwner,
          ref: template.repoVersion,
          path: template.path,
          mediaType: {
            format: "raw"
          }
        });
        //reqRemaining = response.headers["x-ratelimit-remaining"];

        const readme = await findFileContentAsync("README.md", response.data);
        const deploy = await findFileContentAsync(["deploy.yaml", "deploy.yml"], response.data);
        const guide = await findFileContentAsync("GUIDE.md", response.data);

        template.readme = replaceLinks(readme, template.repoOwner, template.repoName, template.repoVersion, template.path);
        template.deploy = deploy;
        template.persistentStorageEnabled = deploy && (deploy.includes("persistent: true") || deploy.includes("persistent:true"));
        template.guide = guide;
        template.githubUrl = `https://github.com/${template.repoOwner}/${template.repoName}/blob/${template.repoVersion}/${template.path}`;

        if (!template.logoUrl) {
          template.logoUrl = getLogoFromPath(template.path);
        }

        if (!template.summary) {
          template.summary = getTemplateSummary(readme);
        }

        template.id = `${template.repoOwner}-${template.repoName}-${template.path}`;
        template.path = template.id; // For compatibility with old deploy tool versions (TODO: remove in future)

        delete template.repoOwner;
        delete template.repoName;
        delete template.repoVersion;

        console.log(category.title + " - " + template.name);
      } catch (err) {
        console.warn(`Skipped ${template.name} because of error: ${err.message || err}`);
      }
    }
  }

  // Remove templates without "README.md" and "deploy.yml"
  categories.forEach((c) => {
    c.templates = c.templates.filter((x) => x.readme && x.deploy);
  });
  categories = categories.filter((x) => x.templates?.length > 0);

  //console.log("Requests remaining: " + reqRemaining);

  return categories;
}

// Find a github file by name and dowload it
async function findFileContentAsync(filename, fileList) {
  const filenames = typeof filename === "string" ? [filename] : filename;
  const fileDef = fileList.find((f) => filenames.some((x) => x.toLowerCase() === f.name.toLowerCase()));

  if (!fileDef) return null;

  const response = await fetch(fileDef.download_url);
  const content = await response.text();

  return content;
}

// Create a short summary from the README.md
function getTemplateSummary(readme) {
  if (!readme) return null;

  const markdown = readme
    .replace(/!\[.+\]\(.+\)\n+/g, "") // Remove images
    .replace(/^#+ .*\n+/g, ""); // Remove first header
  const readmeTxt = removeMarkdown(markdown).trim();
  const maxLength = 200;
  const summary = readmeTxt.length > maxLength ? readmeTxt.substring(0, maxLength - 3).trim() + "..." : readmeTxt;

  return summary;
}

// Replaces local links with absolute links
function replaceLinks(markdown, owner, repo, version, folder) {
  let newMarkdown = markdown;
  const linkRegex = /!?\[([^\[]+)\]\((.*?)\)/gm;
  const matches = newMarkdown.matchAll(linkRegex);
  for (const match of matches) {
    const url = match[2].startsWith("/") ? match[2].substring(1) : match[2];
    if (isUrlAbsolute(url)) continue;
    const isPicture = match[0].startsWith("!");
    const absoluteUrl = isPicture
      ? `https://raw.githubusercontent.com/${owner}/${repo}/${version}/${folder}/` + url
      : `https://github.com/${owner}/${repo}/blob/${version}/${folder}/` + url;

    newMarkdown = newMarkdown.split("(" + url + ")").join("(" + absoluteUrl + ")");
  }

  return newMarkdown;
}
