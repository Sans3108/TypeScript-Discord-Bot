# TypeScript-Discord-Bot

[![CodeQL](https://github.com/Sans3108/TypeScript-Discord-Bot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Sans3108/TypeScript-Discord-Bot/actions/workflows/github-code-scanning/codeql)

My go-to template for building Discord bots with TypeScript & discord.js

## Requirements

- [NodeJS](https://nodejs.org)
  <br> Latest LTS version is recommended.
- [pnpm](https://pnpm.io/)
  <br> Or otherwise your favorite package manager.
- Some knowledge of how to run a Discord bot.

## Features

- Organized directories for commands, events, scripts etc.
- Easy to navigate/understand code base.
- Minimal setup required to get online.
- Localization support already built-in usin [i18next](https://www.npmjs.com/package/i18next).

## How to use

- Click on the `Use this template` button and create a new repository with your desired name.
- Clone your brand new repository, open it in your IDE of choice and start editing.
- When you are ready to run your bot:
  - Copy and paste `.env.example`, rename it to `.env` and replace the values inside with your environment variables.
  - Run `pnpm build` and `pnpm start`, and your bot should be online.
    <br> _Instead of `pnpm` use your package manager._

## Contributing

- There are no real guidelines for contributing, the only thing that must be done however, is making sure the `prettier` script is ran before opening a pull request.

#### To-Do's:

- [ ] Add better documentation.
- [ ] Simplify some parts of the code and add comments.
