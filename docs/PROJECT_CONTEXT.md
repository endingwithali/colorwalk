# Colorwalk Project Context

## Project Summary

`colorwalk` is a learning-focused full-stack and self-hosting project.

The product idea is a website or small web system that selects one random color each day and invites people to go on a "color walk": a low-tech outdoor walk where participants intentionally look for things matching that day's color.

This project is not primarily about building a complex product. Its main purpose is to build backend development confidence, deployment confidence, and service-maintenance instincts through a concrete, emotionally approachable app.

## What Is A Color Walk?

A color walk is an intentional walk where a participant looks for a specific color in their environment.

The idea is not original to this project. This project uses the concept as the basis for a lightweight daily web experience.

## Primary Learning Goal

The owner is a mid-level engineer currently looking for a job. Work on this project should optimize for learning backend development, system design, self-hosting, deployment, and service maintenance.

When making technical choices, prioritize:

1. Clear understanding over cleverness.
2. Small, reversible changes over big rewrites.
3. Backend maintainability over frontend flash.
4. Cheap, practical tooling over expensive or overpowered AI/model usage.
5. Interview-useful explanations and artifacts.
6. Real deployment confidence, including debugging production-like issues.

## Product Goal

Build a website or system that:

- Chooses a random color each day.
- Displays that color clearly to users.
- Gives users a simple reason to go outside and notice that color.
- Keeps the first version small and understandable.

Possible future features include:

- Color history.
- Sharing.
- User submissions.
- Photos.
- Lightweight prompts.
- Location-aware participation, only if there is a clear privacy-conscious reason.

These future features should not distract from the first milestone.

## Technical Learning Goals

This project should help the owner learn to:

- Self-host a real project.
- Connect a frontend, backend, and database.
- Deploy a self-hosted project to the public internet.
- Reduce deployment anxiety by practicing real releases.
- Understand backend service ownership.
- Use AI coding agents effectively.
- Ask better questions of AI tools when configuring infrastructure, services, deployments, and debugging.
- Build confidence reading logs, inspecting state, and making careful fixes.

## AI Collaboration Preferences

When AI agents work on this project, they should:

- Explain the plan before implementing.
- Ask before modifying files unless the user has already clearly granted permission for the specific change.
- Prefer existing project patterns.
- Keep changes small and understandable.
- Avoid speculative rewrites.
- Explain backend concepts in context.
- Highlight risks around auth, config, secrets, databases, deployments, and data loss.
- Optimize for cheap models and cost-effective agent usage.
- Produce interview-useful explanations when relevant.
- Help the owner understand what changed and why.

## Interview-Oriented Goal

A secondary goal is to turn this project into something useful during interviews.

Work should support the owner being able to explain:

- Why the architecture was chosen.
- How the frontend, backend, and database communicate.
- How deployment works.
- How configuration and secrets are managed.
- How the service could fail.
- How bugs were debugged.
- How AI was used responsibly without outsourcing understanding.
- What tradeoffs were made to keep the project affordable and maintainable.

## Engineering Bias

Default to simple, boring, inspectable backend choices unless there is a strong reason to do otherwise.

Good defaults:

- Small API surface.
- Clear environment configuration.
- Minimal dependencies.
- Explicit database schema and migrations.
- Basic observability through logs.
- Simple deployment notes.
- A README that explains how to run, deploy, and debug the system.
- Cheap AI usage: use smaller or cheaper models for routine edits, and reserve stronger models for architecture, security, or complex debugging.

## First Milestone

A strong first milestone would include:

- A page that shows today's color.
- A backend endpoint that returns today's color.
- A repeatable rule for selecting the daily color.
- A small database or persisted store if needed.
- Local development instructions.
- Basic deployment notes.
- A short "what I learned" section for interview reflection.

## Maintenance Mindset

Treat this project as a small real service, not just a coding exercise.

Useful maintainer questions:

- What happens if the app restarts?
- What happens if the database is empty?
- What happens if the deploy fails halfway through?
- How do I know the service is healthy?
- How do I roll back a bad change?
- Where do secrets live?
- What logs would help me debug this in production?
- What would I tell an interviewer about this design choice?
