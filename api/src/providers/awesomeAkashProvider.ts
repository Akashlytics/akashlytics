import fetch from "node-fetch";
import removeMarkdown from "markdown-to-text";
import path from "path";
import { getOctokit } from "./githubProvider";
import { isUrlAbsolute } from "@src/shared/utils/urls";
import * as fs from "fs";

const logoBaseUrl = "https://storage.googleapis.com/akashlytics-deploy-public/template_logos/";
const logos = {
  wordpress: "wordpress.png",
  drupal: "drupal.png",
  wikijs: "wikijs.svg",
  confluence: "confluence.svg",
  pgadmin4: "postgresql.png",
  postgres: "postgresql.png",
  mongoDB: "mongodb.jpg",
  adminer: "adminer.png",
  MySQL: "mysql.png",
  couchdb: "couchdb.svg",
  influxdb: "influxdb.svg",
  odoo: "odoo.svg",
  mattermost: "mattermost.svg",
  jenkins: "jenkins.svg",
  bitbucket: "bitbucket.svg",
  "azure-devops-agent": "azure-devops.webp",
  minecraft: "minecraft.png",
  tetris: "tetris.webp",
  tetris2: "tetris.webp",
  pacman: "pacman.png",
  supermario: "mario.png",
  minesweeper: "minesweeper.png",
  doom: "doom.jpg"
};

let generatingTask = null;
let lastServedData = null;

export const getTemplateGallery = async () => {
  try {
    const version = await fetchAwesomeAkashRepoVersion();
    const filePath = `data/templates/${version}.json`;

    if (fs.existsSync(filePath)) {
      console.log("Serving template gallery from local cache");
      const fileContent = fs.readFileSync(filePath, "utf8");
      const templateGallery = JSON.parse(fileContent);
      lastServedData = templateGallery;
      return templateGallery;
    }

    if (generatingTask) {
      console.log("Waiting on existing generation task to finish");
      return await generatingTask;
    } else {
      generatingTask = generateTemplateGalleryAsync(version);
      const templateGallery = await generatingTask;
      generatingTask = null;

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(templateGallery, null, 2));

      lastServedData = templateGallery;

      return templateGallery;
    }
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

export const fetchAwesomeAkashRepoVersion = async () => {
  const octokit = getOctokit();

  const response = await octokit.rest.repos.getBranch({
    owner: "ovrclk",
    repo: "awesome-akash",
    branch: "master"
  });

  const reqRemaining = response.headers["x-ratelimit-remaining"];
  console.log(`${reqRemaining} requests remaining`);

  if (response.status !== 200) {
    throw new Error("Failed to fetch latest version from github");
  }

  return response.data.commit.sha;
};

export async function generateTemplateGalleryAsync(sha: string) {
  const octokit = getOctokit();

  // Fetch list of templates from README.md
  const response = await octokit.rest.repos.getContent({
    repo: "awesome-akash",
    owner: "ovrclk",
    path: "README.md",
    ref: sha,
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
          path: templateMatch[3]
        });
      }
    }

    categories.push({
      title: title,
      description: description,
      templates: templates
    });
  }

  for (const category of categories) {
    for (const template of category.templates) {
      try {
        // Ignoring templates that are not in the awesome-akash repo
        if (template.path.startsWith("http:") || template.path.startsWith("https:")) {
          throw "Absolute URL";
        }

        // Fetching file list in template folder
        const response = await octokit.rest.repos.getContent({
          repo: "awesome-akash",
          owner: "ovrclk",
          ref: sha,
          path: template.path,
          mediaType: {
            format: "raw"
          }
        });
        reqRemaining = response.headers["x-ratelimit-remaining"];

        const readme = await findFileContentAsync("README.md", response.data);
        const deploy = await findFileContentAsync(["deploy.yaml", "deploy.yml"], response.data);
        const guide = await findFileContentAsync("GUIDE.md", response.data);

        template.readme = replaceLinks(readme, "ovrclk", "awesome-akash", sha, template.path);
        template.summary = getTemplateSummary(readme);
        template.deploy = deploy;
        template.guide = guide;
        template.logoUrl = template.path in logos ? logoBaseUrl + logos[template.path] : null;
        template.githubUrl = `https://github.com/ovrclk/awesome-akash/blob/${sha}/${template.path}`;
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

  console.log("Requests remaining: " + reqRemaining);

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

  const markdown = readme.replace(/^#+ .*\n+/g, "");
  const readmeTxt = removeMarkdown(markdown);
  const maxLength = 200;
  const summary = readmeTxt.length > maxLength ? readmeTxt.substring(0, maxLength - 3) + "..." : readmeTxt;

  return summary;
}

// Replaces local links with absolute links
function replaceLinks(markdown, owner, repo, sha, folder) {
  let newMarkdown = markdown;
  const linkRegex = /!?\[([^\[]+)\]\((.*?)\)/gm;
  const matches = newMarkdown.matchAll(linkRegex);
  for (const match of matches) {
    const url = match[2].startsWith("/") ? match[2].substring(1) : match[2];
    if (isUrlAbsolute(url)) continue;
    const isPicture = match[0].startsWith("!");
    const absoluteUrl = isPicture
      ? `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${folder}/` + url
      : `https://github.com/${owner}/${repo}/blob/${sha}/${folder}/` + url;

    newMarkdown = newMarkdown.split("(" + url + ")").join("(" + absoluteUrl + ")");
  }

  return newMarkdown;
}
