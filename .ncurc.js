module.exports = {
  reject: [
    // tape >=5.10.0 ships a tsconfig.json that extends the unpublished @ljharb/tsconfig package.
    // This repo runs tape under ts-node in script mode (npx ts-node node_modules/tape/bin/tape ...),
    // which pulls tape's own tsconfig into the program and fails with
    // "error TS6053: File '@ljharb/tsconfig' not found". Empirically reproduced: bumping only tape
    // (all other updates applied) breaks test:unit; pinning tape at 5.9.x makes all gates pass.
    'tape',
    // @types/node's major must match the Node runtime major in .nvmrc (currently 24). A higher major
    // makes tsc accept Node-26-only APIs that then crash at runtime on Node 24 — a failure mode the
    // test gates cannot catch (it only weakens type checking). Bump together with the runtime.
    '@types/node'
  ]
}
