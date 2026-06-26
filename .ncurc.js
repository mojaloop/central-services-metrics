module.exports = {
  reject: [
    // eslint 9.x -> 10.x is a major bump with flat-config and rule-set changes that can break the
    // existing lint pipeline (and the @typescript-eslint 8.x stack pinned here targets eslint 9).
    // Hold at 9.x pending a deliberate flat-config/tooling migration.
    'eslint',
    // typescript 5.9 -> 6.0 is a major compiler bump. It drives the entire build (tsc) and the
    // typed-lint pass, so it can introduce new type errors / emit changes. Pin to 5.x and migrate
    // deliberately with a full build+test pass rather than as a routine maintenance update.
    'typescript',
    // tape 5.9.0 -> 5.10.2 breaks the ts-node test runner with "TS6053: File '@ljharb/tsconfig'
    // not found". 5.10.x reshapes its deep-equal/@ljharb-* sub-tree so that ts-node pulls those
    // packages' own tsconfig.json (which extends the dev-only, uninstalled @ljharb/tsconfig) into
    // the program when globbing the .test.ts files. Confirmed by bisection: with tape pinned at
    // 5.9.0 and every other update applied, all gates pass; bumping only tape reproduces the
    // failure. Hold at 5.9.x until the upstream ts-node interaction is resolved.
    'tape'
  ]
}
