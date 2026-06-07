# Merchant Portal Frontend Development Rules

## Project context

This repository contains the frontend merchant portal for the thesis payment aggregator system.

The frontend is built with Nuxt and Vue.
It is the only UI used by the merchant.

The frontend must:
- authenticate the user
- communicate only with API Gateway
- display merchant-facing data and flows
- remain simple, clean, and demo-ready

The frontend must NOT:
- call User Service directly
- call Payment Service directly
- call Blockchain Core directly
- contain backend business logic
- store internal secrets
- store private keys

## Architecture constraints

- Use Nuxt
- Use Vue 3
- Use TypeScript
- Use Pinia for app state
- Use composables for API access
- Keep pages and components simple and explicit
- Prefer a clean MVP over overengineering

## API rules

- All frontend API calls go only to API Gateway
- Support both real Bearer-token flow and local development auth bypass if available
- Do not duplicate backend validation deeply in the frontend
- Show backend errors clearly in the UI

## UI scope

Implement only the merchant portal MVP:
- auth entry
- dashboard
- merchant profile/settings
- products
- paywalls
- payment intents
- execution demo/status view

## Workflow rules

For every task:
1. Read the spec and current docs
2. Inspect existing code before changing anything
3. Write a short implementation plan
4. Implement the smallest correct UI slice
5. Add/update tests where reasonable
6. Run validation
7. Update docs if needed

## Safety rules

- Do not rewrite the entire app unless necessary
- Do not add unrelated features
- Keep components small
- Keep the design presentable for demo and thesis screenshots

## Definition of done

A task is done only if:
- code is implemented
- app runs
- key flows are testable manually
- docs are updated if needed