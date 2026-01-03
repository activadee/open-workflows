#!/usr/bin/env bun
/// <reference types="bun-types" />

import { parseArgs } from "util"

const PACKAGE_NAME = process.env.PACKAGE_NAME || ""

async function getCurrentNpmVersion(): Promise<string> {
  if (!PACKAGE_NAME) {
    const pkg = await Bun.file("package.json").json()
    return pkg.version || "0.0.0"
  }
  
  try {
    const result = await Bun.$`npm view ${PACKAGE_NAME} version`.text()
    return result.trim()
  } catch {
    return "0.0.0"
  }
}

function bumpVersion(version: string, type: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = version.split(".").map(Number)
  switch (type) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
  }
}

async function updatePackageVersion(newVersion: string): Promise<void> {
  const pkgPath = "package.json"
  let pkg = await Bun.file(pkgPath).text()
  pkg = pkg.replace(/"version": "[^"]+"/, `"version": "${newVersion}"`)
  await Bun.write(pkgPath, pkg)
  console.log(`Updated package.json to v${newVersion}`)
}

async function generateChangelog(previousVersion: string): Promise<string[]> {
  const notes: string[] = []

  try {
    const tagExists = await Bun.$`git rev-parse v${previousVersion}`.nothrow()
    if (tagExists.exitCode !== 0) {
      console.log("No previous tag found, skipping changelog")
      return notes
    }

    const log = await Bun.$`git log v${previousVersion}..HEAD --oneline --format="%h %s"`.text()
    const commits = log
      .split("\n")
      .filter((line) => line.trim())
      .filter((line) => !line.match(/^\w+ (chore:|test:|ci:|docs:|release:|Merge )/i))

    if (commits.length > 0) {
      for (const commit of commits) {
        notes.push(`- ${commit}`)
      }
    }
  } catch (error) {
    console.log("Failed to generate changelog:", error)
  }

  return notes
}

async function getContributors(previousVersion: string, repo: string): Promise<string[]> {
  const notes: string[] = []
  const excludeUsers = ["github-actions[bot]", "actions-user", "dependabot[bot]"]

  try {
    const tagExists = await Bun.$`git rev-parse v${previousVersion}`.nothrow()
    if (tagExists.exitCode !== 0) return notes

    const compare = await Bun.$`gh api "/repos/${repo}/compare/v${previousVersion}...HEAD" --jq '.commits[] | {login: .author.login, message: .commit.message}'`.text()
    const contributors = new Map<string, string[]>()

    for (const line of compare.split("\n").filter(Boolean)) {
      try {
        const { login, message } = JSON.parse(line) as { login: string | null; message: string }
        const title = message.split("\n")[0] ?? ""
        if (title.match(/^(chore:|test:|ci:|docs:|release:)/i)) continue

        if (login && !excludeUsers.includes(login)) {
          if (!contributors.has(login)) contributors.set(login, [])
          contributors.get(login)?.push(title)
        }
      } catch {
        continue
      }
    }

    if (contributors.size > 0) {
      notes.push("")
      notes.push(`**Contributors:**`)
      for (const [username] of contributors) {
        notes.push(`- @${username}`)
      }
    }
  } catch {}

  return notes
}

async function buildProject(): Promise<void> {
  console.log("\nBuilding project...")
  await Bun.$`bun run build`
}

async function packProject(): Promise<string> {
  console.log("\nPacking project...")
  const output = await Bun.$`bun pm pack`.text()
  const tarball = output.split("\n").find(line => line.trim().endsWith(".tgz"))?.trim()
  if (!tarball) {
    throw new Error("Failed to get tarball name from bun pm pack")
  }
  console.log(`Created: ${tarball}`)
  return tarball
}

async function publishToNpm(tarball: string): Promise<void> {
  console.log("\nPublishing to npm...")
  
  if (process.env.CI) {
    await Bun.$`npm publish ${tarball} --access public --provenance`
  } else {
    await Bun.$`npm publish ${tarball} --access public`
  }
}

async function gitTagAndRelease(newVersion: string, notes: string[], repo: string): Promise<void> {
  if (!process.env.CI) {
    console.log("\nSkipping git operations (not in CI)")
    return
  }

  console.log("\nCommitting and tagging...")
  await Bun.$`git config user.email "github-actions[bot]@users.noreply.github.com"`
  await Bun.$`git config user.name "github-actions[bot]"`
  await Bun.$`git add package.json`

  const hasStagedChanges = await Bun.$`git diff --cached --quiet`.nothrow()
  if (hasStagedChanges.exitCode !== 0) {
    await Bun.$`git commit -m "release: v${newVersion} [skip ci]"`
  } else {
    console.log("No changes to commit (version already updated)")
  }

  const tagExists = await Bun.$`git rev-parse v${newVersion}`.nothrow()
  if (tagExists.exitCode !== 0) {
    await Bun.$`git tag v${newVersion}`
  } else {
    console.log(`Tag v${newVersion} already exists`)
  }

  await Bun.$`git push origin HEAD --tags`

  console.log("\nCreating GitHub release...")
  const releaseNotes = notes.length > 0 ? notes.join("\n") : "No notable changes"
  const releaseExists = await Bun.$`gh release view v${newVersion}`.nothrow()
  if (releaseExists.exitCode !== 0) {
    await Bun.$`gh release create v${newVersion} --title "v${newVersion}" --notes ${releaseNotes}`
  } else {
    console.log(`Release v${newVersion} already exists`)
  }
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      bump: { type: "string" },
      version: { type: "string" },
      repo: { type: "string" },
      "skip-build": { type: "boolean", default: false },
    },
    strict: true,
  })

  const { bump, version: overrideVersion, repo, "skip-build": skipBuild } = values

  if (!bump && !overrideVersion) {
    console.error("Either --bump (major|minor|patch) or --version is required")
    process.exit(1)
  }

  if (!repo) {
    console.error("--repo is required (e.g., owner/repo)")
    process.exit(1)
  }

  const currentVersion = await getCurrentNpmVersion()
  console.log(`Current version: ${currentVersion}`)

  let newVersion: string
  if (overrideVersion) {
    newVersion = overrideVersion.replace(/^v/, "")
  } else if (bump === "major" || bump === "minor" || bump === "patch") {
    newVersion = bumpVersion(currentVersion, bump)
  } else {
    console.error("Invalid bump type. Use major, minor, or patch")
    process.exit(1)
  }

  console.log(`New version: ${newVersion}`)

  await updatePackageVersion(newVersion)

  const changelog = await generateChangelog(currentVersion)
  const contributors = await getContributors(currentVersion, repo)
  const notes = [...changelog, ...contributors]

  if (notes.length > 0) {
    console.log("\nRelease notes:")
    console.log(notes.join("\n"))
  }

  if (!skipBuild) {
    await buildProject()
  }

  const tarball = await packProject()
  await publishToNpm(tarball)
  await gitTagAndRelease(newVersion, notes, repo)

  console.log(`\nRelease v${newVersion} complete!`)
}

main().catch((err) => {
  console.error("Release failed:", err.message || err)
  process.exit(1)
})
