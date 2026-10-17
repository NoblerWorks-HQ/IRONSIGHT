# Contributing

Thanks for your interest. IRONSIGHT is a viewer over free, public OSINT feeds: a Next.js app whose API routes proxy each upstream source, and a set of per-theater config objects that decide what each panel shows. The bar for a good PR is "it lints, the tests pass, it builds, and the dashboard still loads for both theaters".

## Getting set up

```sh
nvm use          # Node 22, see .nvmrc
npm install
npm run dev      # http://localhost:3000
```

No API keys or environment variables are needed. Use the **THEATER** toggle in the header to check both conflicts.

## Before you open a PR

1. **`npm run lint`, `npm test` and `npm run build` must pass** (CI runs all three).
2. **Check both theaters.** Panels, map layers and feeds are scoped per conflict through the config objects in `src/lib/conflicts/`. A change that works for Iran/Israel can silently break Russia/Ukraine.
3. **Touched an upstream feed?** Each source lives in one route under `src/app/api/*/route.ts`. Say which provider changed and attach a sample of the response shape. Response types are defined once in `src/lib/types/api.ts`.
4. **Adding a data source?** It must be free, public and keyless, and it must be credited in the README's Data Sources and Credits sections. IRONSIGHT does not own any of the data it shows.
5. **Adding a conflict?** Add a config file under `src/lib/conflicts/` and register it. That is most of the work.

## What does not belong here

- Sources that need a paid plan or an API key.
- Anything that scrapes behind a login or bypasses a provider's access controls.
- Features that identify or target private individuals.

## Landing page

The GitHub Pages site lives in `site/` and is plain HTML. `python3 .github/scripts/check-site.py` validates it, and the Pages workflow runs the same check on every pull request.

## Conduct

See the [code of conduct](./CODE_OF_CONDUCT.md). Security issues go through the [organization's private reporting process](https://github.com/NoblerWorks-HQ/.github/blob/main/SECURITY.md), not a public issue.
