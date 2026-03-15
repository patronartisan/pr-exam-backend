# Error Handling Guide

This document defines where error handling should happen in this codebase and what each layer is responsible for.

## Why This Matters

- Keeps API behavior predictable
- Prevents leaking internal implementation details
- Gives users clear and actionable feedback
- Avoids duplicate validation logic and inconsistent responses

## Backend Responsibilities (Authoritative)

The backend is the source of truth for validation and failure responses.

Required on backend:

- Validate all incoming request data (shape, type, required fields, ranges)
- Validate resource existence before update/delete (agent/property/note/reminder)
- Validate business constraints (example: one family per property)
- Return correct HTTP status codes
- Return consistent error payloads through centralized middleware
- Log internal failures for debugging/operations

Backend should return:

- 400 for invalid route/query/body values
- 401 for missing/invalid auth token
- 403 for forbidden actions (if introduced)
- 404 for missing resources
- 409 for business conflicts
- 500 for unexpected internal failures
