#!/usr/bin/env node
/**
 * scripts/sync-to-notion.ts
 *
 * One-way push: open GitHub issues ("beads") → Notion task database.
 * Surfaces blocked vs ready status, priority, and links back to GitHub.
 *
 * Usage:
 *   npx tsx scripts/sync-to-notion.ts
 *
 * Required environment variables:
 *   NOTION_TOKEN        Notion internal integration secret (starts with "secret_")
 *   GITHUB_TOKEN        GitHub personal access token (read:repo scope)
 *
 * Optional:
 *   NOTION_DATABASE_ID  Notion database ID (default: 35b4d0c655b881ada8bafc66666852ff)
 *   GITHUB_REPO         owner/repo slug (default: Luan-vP/meta-model-analyzer)
 *
 * Notion database property names expected (adjust PROP_* constants below if yours differ):
 *   Name         Title property — issue title
 *   Status       Select — Open | Blocked | Ready
 *   Priority     Select — High | Medium | Low
 *   GitHub URL   URL — link to the issue
 *   GitHub ID    Number — issue number
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID ?? '35b4d0c655b881ada8bafc66666852ff'
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'Luan-vP/meta-model-analyzer'
const NOTION_TOKEN = process.env.NOTION_TOKEN
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// Notion database property names — edit these if your DB uses different names
const PROP_STATUS = 'Status'
const PROP_PRIORITY = 'Priority'
const PROP_GITHUB_URL = 'GitHub URL'
const PROP_GITHUB_ID = 'GitHub ID'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const GITHUB_API = 'https://api.github.com'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubLabel {
  name: string
}

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  labels: GitHubLabel[]
  body: string | null
  pull_request?: unknown  // present on PRs — we skip these
}

type Priority = 'High' | 'Medium' | 'Low'
type IssueStatus = 'Open' | 'Blocked' | 'Ready'

interface NotionPageProperties {
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

function labelNames(labels: GitHubLabel[]): string[] {
  return labels.map(l => l.name.toLowerCase())
}

function derivePriority(labels: GitHubLabel[]): Priority {
  const names = labelNames(labels)
  if (names.some(n => n.includes('high') || n === 'p1' || n === 'priority: high')) return 'High'
  if (names.some(n => n.includes('low') || n === 'p3' || n === 'priority: low')) return 'Low'
  return 'Medium'
}

function deriveStatus(labels: GitHubLabel[]): IssueStatus {
  const names = labelNames(labels)
  if (names.some(n => n.includes('blocked'))) return 'Blocked'
  if (names.some(n => n.includes('ready') || n === 'good first issue')) return 'Ready'
  return 'Open'
}

// ---------------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------------

async function fetchOpenIssues(): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = []
  let page = 1

  while (true) {
    const url = `${GITHUB_API}/repos/${GITHUB_REPO}/issues?state=open&per_page=100&page=${page}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
    })

    if (!res.ok) {
      throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
    }

    const batch = (await res.json()) as GitHubIssue[]
    if (batch.length === 0) break

    // GitHub issues endpoint returns PRs too — filter them out
    issues.push(...batch.filter(i => !i.pull_request))
    if (batch.length < 100) break
    page++
  }

  return issues
}

// ---------------------------------------------------------------------------
// Notion API helpers
// ---------------------------------------------------------------------------

function notionHeaders(): Record<string, string> {
  if (!NOTION_TOKEN) throw new Error('NOTION_TOKEN is not set')
  return {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  }
}

async function notionRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: notionHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion API error ${res.status} on ${method} ${path}: ${text}`)
  }

  return res.json()
}

/** Returns a map of GitHub issue URL → Notion page ID for existing pages. */
async function queryExistingPages(): Promise<Map<string, string>> {
  const existing = new Map<string, string>()
  let cursor: string | undefined

  while (true) {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const result = (await notionRequest(
      'POST',
      `/databases/${NOTION_DATABASE_ID}/query`,
      body,
    )) as { results: Array<{ id: string; properties: NotionPageProperties }>; has_more: boolean; next_cursor?: string }

    for (const page of result.results) {
      const urlProp = page.properties[PROP_GITHUB_URL] as { url?: string } | undefined
      if (urlProp?.url) {
        existing.set(urlProp.url, page.id)
      }
    }

    if (!result.has_more) break
    cursor = result.next_cursor
  }

  return existing
}

function buildPageProperties(issue: GitHubIssue): NotionPageProperties {
  const status = deriveStatus(issue.labels)
  const priority = derivePriority(issue.labels)

  return {
    Name: {
      title: [{ type: 'text', text: { content: issue.title } }],
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

async function createPage(issue: GitHubIssue): Promise<void> {
  await notionRequest('POST', '/pages', {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: buildPageProperties(issue),
    children: issue.body
      ? [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: issue.body.slice(0, 2000) },
                },
              ],
            },
          },
        ]
      : [],
  })
}

async function updatePage(pageId: string, issue: GitHubIssue): Promise<void> {
  await notionRequest('PATCH', `/pages/${pageId}`, {
    properties: buildPageProperties(issue),
  })
}

/** Notion rate limit is ~3 req/s — small sleep between writes to stay safe. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main sync
// ---------------------------------------------------------------------------

async function sync(): Promise<void> {
  if (!NOTION_TOKEN) {
    console.error('Error: NOTION_TOKEN environment variable is required.')
    process.exit(1)
  }

  console.log(`Fetching open issues from ${GITHUB_REPO}...`)
  const issues = await fetchOpenIssues()
  console.log(`Found ${issues.length} open issue(s).`)

  console.log(`Querying Notion database ${NOTION_DATABASE_ID}...`)
  const existingPages = await queryExistingPages()
  console.log(`Found ${existingPages.size} existing page(s) in Notion.`)

  let created = 0
  let updated = 0
  let failed = 0

  for (const issue of issues) {
    const label = `#${issue.number} — ${issue.title}`
    try {
      const existingId = existingPages.get(issue.html_url)
      if (existingId) {
        await updatePage(existingId, issue)
        console.log(`  Updated: ${label}`)
        updated++
      } else {
        await createPage(issue)
        console.log(`  Created: ${label}`)
        created++
      }
      await sleep(350) // ~3 req/s
    } catch (err) {
      console.error(`  Failed:  ${label}\n    ${err}`)
      failed++
    }
  }

  console.log(`\nSync complete — created: ${created}, updated: ${updated}, failed: ${failed}`)
}

sync().catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
