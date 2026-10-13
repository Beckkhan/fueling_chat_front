# Fueling Chat Frontend

## Purpose
React SPA chat UI for the fueling chat: sends prompts (optionally pinned fueling id) to the backend POST /chat and renders replies, including masked-error bubbles per CONTRACT-UI-002.

## Stack
- React 19, TypeScript 5.7, Vite 8, Tailwind 4
- Vitest + React Testing Library
- ESLint + Prettier, pnpm

## Setup

    pnpm install
    cp .env.example .env.local   # set VITE_API_URL, default http://localhost:8080
    pnpm dev

## Commands

    pnpm build
    pnpm test
    pnpm lint

## Layout

    src/: components/, hooks/, api/ (chat.ts client), types/, App.tsx

## API integration
sendChat builds the exact CONTRACT-API-001 payload; non-JSON and network failures fall back to masked bubbles; provider wiring per D-13/D-7.

## Experiment note
T15 (this repo's only experiment task) was implemented twice: on branch first by frontend-coder, on branch second by frontend-architect + frontend-implementer. Review verdicts live in reviews/ on each branch.
