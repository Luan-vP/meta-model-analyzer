/**
 * One-way sync: open GitHub issues → Notion task database.
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx [GITHUB_TOKEN=ghp_xxx] npx tsx scripts/sync-to-notion.ts
 *
 * Optional env vars:
 *   NOTION_DATABASE_ID  – override the default DB from the issue spec
 *   GITHUB_REPO         – owner/repo, defaults to Luan-vP/meta-model-analyzer
 */

import { Client } from '@notionhq/client'

// ── configuration ──────────────────────────────────────────────────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID =
  process.env.NOTION_DATABASE_ID ?? '35b4d0c655b881ada8bafc66666852ff'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'Luan-vP/meta-model-analyzer'

// Notion property names — edit here if your DB uses different names
const PROP_NAME = 'Name'
const PROP_STATUS = 'Status'
const PROP_PRIORITY = 'Priority'
const PROP_GITHUB_URL = 'GitHub URL'
const PROP_GITHUB_ID = 'GitHub ID'

// ── types ──────────────────────────────────────────────────────────────────

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  labels: Array<{ name: string }>
  pull_request?: unknown
}

type Status = 'Open' | 'Blocked' | 'Ready'
type Priority = 'High' | 'Medium' | 'Low'

// ── helpers ────────────────────────────────────────────────────────────────

function detectStatus(labels: string[]): Status {
  const lower = labels.map((l) => l.toLowerCase())
  if (lower.some((l) => l.includes('blocked'))) return 'Blocked'
  if (lower.some((l) => l.includes('ready') || l.includes('good first issue')))
    return 'Ready'
  return 'Open'
}

function detectPriority(labels: string[]): Priority {
  const lower = labels.map((l) => l.toLowerCase())
  if (lower.some((l) => l.includes('high') || l.includes('p1'))) return 'High'
  if (lower.some((l) => l.includes('low') || l.includes('p3'))) return 'Low'
  return 'Medium'
}

async function fetchAllOpenIssues(): Promise<GitHubIssue[]> {
  const [owner, repo] = GITHUB_REPO.split('/')
  const headers: Record<string, string> = { 'User-Agent': 'notion-sync' }
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`

  const issues: GitHubIssue[] = []
  let page = 1

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`
    const res = await fetch(url, { headers })

    if (!res.ok) {
      throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
    }

    const batch = (await res.json()) as GitHubIssue[]
    if (batch.length === 0) break

    // GitHub returns PRs in the issues endpoint — skip them
    issues.push(...batch.filter((i) => !i.pull_request))
    if (batch.length < 100) break
    page++
  }

  return issues
}

async function fetchExistingPages(
  notion: Client,
): Promise<Map<number, string>> {
  // Returns a map of GitHub issue number → Notion page ID
  const map = new Map<number, string>()
  let cursor: string | undefined

  while (true) {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    })

    for (const page of res.results) {
      if (page.object !== 'page') continue
      const props = (page as { properties: Record<string, unknown> }).properties
      const idProp = props[PROP_GITHUB_ID] as
        | { type: 'number'; number: number | null }
        | undefined
      if (idProp?.type === 'number' && idProp.number !== null) {
        map.set(idProp.number, page.id)
      }
    }

    if (!res.has_more) break
    cursor = res.next_cursor ?? undefined
  }

  return map
}

function buildProperties(issue: GitHubIssue) {
  const labels = issue.labels.map((l) => l.name)
  const status = detectStatus(labels)
  const priority = detectPriority(labels)

  return {
    [PROP_NAME]: {
      title: [{ text: { content: issue.title } }],
    },
    [PROP_STATUS]: {
      select: { name: status },
    },
    [PROP_PRIORITY]: {
      select: { name: priority },
    },
    [PROP_GITHUB_URL]: {
      url: issue.html_url,
    },
    [PROP_GITHUB_ID]: {
      number: issue.number,
    },
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!NOTION_TOKEN) {
    console.error('Error: NOTION_TOKEN environment variable is required')
    process.exit(1)
  }

  const notion = new Client({ auth: NOTION_TOKEN })

  console.log(`Fetching open issues from ${GITHUB_REPO}…`)
  const issues = await fetchAllOpenIssues()
  console.log(`Found ${issues.length} open issue(s)`)

  console.log('Querying existing Notion pages…')
  const existing = await fetchExistingPages(notion)
  console.log(`Found ${existing.size} existing page(s) in Notion DB`)

  let created = 0
  let updated = 0

  for (const issue of issues) {
    const properties = buildProperties(issue)
    const pageId = existing.get(issue.number)

    if (pageId) {
      await notion.pages.update({ page_id: pageId, properties })
      console.log(`  updated  #${issue.number}: ${issue.title}`)
      updated++
    } else {
      await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      })
      console.log(`  created  #${issue.number}: ${issue.title}`)
      created++
    }

    // Respect Notion's ~3 req/s rate limit
    await sleep(350)
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
