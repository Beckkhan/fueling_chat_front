import { existsSync, readFileSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"

/** This file itself holds the forbidden patterns, so it is excluded from the scan. */
const GUARD_FILE = "src/forbidden-hosts.guard.test.ts"

const backendBase = readBackendBase()

const forbiddenHosts = [
  { label: "Ollama port 11434", pattern: /11434/ },
  { label: "ollama host", pattern: /ollama/i },
  { label: "deepseek host", pattern: /deepseek/i },
  { label: "openai host", pattern: /openai/i },
  { label: "api.<host> URL", pattern: /api\./i },
]

/** Every absolute http(s) URL in the scanned files must target the backend base. */
const absoluteUrl = /https?:\/\/[^\s"'`)]*/g

/** The SVG xmlns attribute is an XML namespace identifier, never a network call. */
const svgNamespace = "http://www.w3.org/2000/svg"

function readBackendBase(): string {
  if (!existsSync(".env.local")) return "http://localhost:8080"
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((entry) => entry.trim().startsWith("VITE_API_URL="))
  return line?.split("=").slice(1).join("=").trim() || "http://localhost:8080"
}

function sourceFiles(): string[] {
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (/\.(ts|tsx|css|html)$/.test(entry.name)) files.push(path)
    }
  }
  walk("src")
  const roots = [
    "index.html",
    "vite.config.ts",
    "vitest.config.ts",
    "eslint.config.js",
    ".env",
    ".env.example",
    ".env.local",
  ]
  for (const file of roots) if (existsSync(file)) files.push(file)
  return files
}

describe("LLM egress guard", () => {
  it("no scanned file references an LLM host or a non-backend absolute URL", () => {
    const violations: string[] = []
    for (const file of sourceFiles()) {
      if (file === GUARD_FILE) continue
      const content = readFileSync(file, "utf8")
      for (const { label, pattern } of forbiddenHosts) {
        const match = content.match(pattern)
        if (match) violations.push(`${file}: forbidden ${label} (${match[0]})`)
      }
      for (const match of content.matchAll(absoluteUrl)) {
        const url = match[0]
        if (url !== svgNamespace && !url.startsWith(backendBase)) {
          violations.push(`${file}: absolute URL ${url} outside the backend base ${backendBase}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
