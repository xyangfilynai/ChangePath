# Access Pass Operations Guide

This document is the practical operator guide for managing ChangePath access keys, issuing passes, cleaning up the local pass registry, and deciding when you need to rebuild or redeploy.

## What Lives Where

- Bundled frontend public key: `src/access/public-key.ts`
- Local private signing key: `.keys/access-pass-private-key.pem`
- Local public key copy: `.keys/access-pass-public-key.pem`
- Local pass registry: `.keys/access-pass-registry.json`

Important:

- Commit `src/access/public-key.ts`
- Do not commit anything inside `.keys/`
- The private key should stay only on the machine that issues passes

## One-Time Setup

Install dependencies:

```bash
npm install
```

Generate the signing keypair:

```bash
npm run access:keypair
```

What this does:

- creates `.keys/access-pass-private-key.pem`
- creates `.keys/access-pass-public-key.pem`
- updates `src/access/public-key.ts`

After generating a new keypair, if you want the live app to accept passes from that keypair, you must commit the updated `src/access/public-key.ts` and deploy it.

## Daily Operator Commands

Check current local operator state:

```bash
npm run access:manage -- status
```

List passes in the local registry:

```bash
npm run access:manage -- list
npm run access:manage -- list --status active
npm run access:manage -- list --status retired
npm run access:manage -- list --status expired
```

Show a pass and recover its raw pass string:

```bash
npm run access:manage -- show --pass-id partner-001
```

## Issue New Passes

Issue a temporary pass and record it in the local registry:

```bash
npm run access:manage -- issue --kind temporary --label "QA tester"
```

Issue a permanent pass and record it in the local registry:

```bash
npm run access:manage -- issue --kind permanent --label "Design partner"
```

Optional flags:

```bash
--pass-id "partner-001"
--issued-at "2026-04-01T00:00:00.000Z"
--private-key "/path/to/access-pass-private-key.pem"
--note "pilot cohort"
```

The command prints:

- `passId`
- label
- issue time
- expiry time
- the raw pass string to paste into the application

## One-Off Pass Generation Without Recording

If you want a pass but do not want it saved into the local registry:

Temporary:

```bash
npm run access:pass -- --kind temporary --label "QA tester"
```

Permanent:

```bash
npm run access:pass -- --kind permanent --label "Design partner"
```

## Temporary vs Permanent Passes

Temporary passes:

- expire exactly 14 days after `issuedAt`
- do not start on first open
- will relock the app on next startup after expiry

Permanent passes:

- do not expire

## How End Users Use a Pass

1. Open the application
2. Copy the raw pass string
3. Paste it into the access screen
4. Click `Unlock`

If verification succeeds, the app stores the validated pass locally on that device and the user does not need to paste it again unless the pass expires or is removed.

## Remove, Retire, Delete, and Prune

These are different actions.

### Remove Access Inside the App

The in-app `Remove access pass` button:

- removes the stored pass from that device
- clears protected local assessment data on that device
- relocks the app

This affects only that device.

### Retire a Registry Entry

Mark a pass as no longer active in your local operator view:

```bash
npm run access:manage -- retire --pass-id partner-001 --reason "Superseded"
```

This:

- keeps the registry entry
- changes its local registry status to retired
- does not remotely revoke a pass already shared

### Delete a Registry Entry

Remove one pass entry from your local registry:

```bash
npm run access:manage -- delete --pass-id partner-001
```

This:

- removes the entry from `.keys/access-pass-registry.json`
- does not delete the signing keypair
- does not remotely revoke a pass already shared

### Prune Registry Entries in Bulk

Delete all retired entries:

```bash
npm run access:manage -- prune --status retired
```

Delete all expired entries:

```bash
npm run access:manage -- prune --status expired
```

This is local registry cleanup only.

## Key Rotation

Generate a brand-new keypair:

```bash
npm run access:keypair
```

This rotates the signing keypair.

Effects:

- newly issued passes will be signed by the new private key
- the frontend must be rebuilt and redeployed with the new bundled public key
- old passes signed by the old private key will stop validating in the new deployed app

Use key rotation when you intentionally want to move to a new signing authority.

## Rebuild vs Redeploy

### No Rebuild and No Redeploy Needed

These are local-only operations:

- issuing a new pass with the current private key
- listing, showing, retiring, deleting, or pruning registry entries
- viewing the local registry

### Rebuild and Redeploy Needed

You need a new deployment when the frontend code changes, including:

- changing `src/access/public-key.ts`
- rotating the keypair with `npm run access:keypair`
- changing any access-screen UI text or behavior
- changing pass verification logic

For Vercel, the normal flow is:

1. commit code changes
2. push to GitHub
3. Vercel automatically rebuilds and redeploys

You do not need to manually run a separate production build before Vercel unless you want to test locally first.

## Vercel Workflow

### If You Only Generated New Passes

No redeploy is needed.

### If You Regenerated the Keypair

Do this:

```bash
npm run access:keypair
git add src/access/public-key.ts
git commit -m "Rotate access pass public key"
git push origin main
```

Then wait for Vercel to deploy.

### If You Changed App Code

Do this:

```bash
git add <changed files>
git commit -m "Describe the change"
git push origin main
```

Then Vercel deploys the updated frontend.

## Recommended Safe Workflows

### First-Time Setup for a New Project

```bash
npm install
npm run access:keypair
git add src/access/public-key.ts
git commit -m "Add access pass public key"
git push origin main
```

After Vercel deploys, issue passes locally.

### Issue a New Temporary Pass

```bash
npm run access:manage -- issue --kind temporary --label "QA tester"
```

Copy the raw pass and send it to the tester.

### Issue a New Permanent Pass

```bash
npm run access:manage -- issue --kind permanent --label "Design partner"
```

### Clean Up Old Registry Entries

```bash
npm run access:manage -- list
npm run access:manage -- prune --status retired
npm run access:manage -- prune --status expired
```

### Recover a Previously Issued Pass

```bash
npm run access:manage -- show --pass-id partner-001
```

## Validation Commands

Check general repo health:

```bash
npm run check-all
```

Check production build:

```bash
npm run build
```

## Revoking Access (Key Rotation as Revocation)

There is no per-pass remote revocation mechanism. A signed pass remains
cryptographically valid until the public key it was signed against is no longer
bundled in the deployed application. To revoke **all** outstanding passes:

1. Rotate the keypair:

```bash
npm run access:keypair
```

2. Commit, push, and redeploy:

```bash
git add src/access/public-key.ts
git commit -m "Rotate access pass keypair to revoke all outstanding passes"
git push origin main
```

3. After the new build deploys, all previously issued passes will fail
   signature verification on next app load and the gate will relock.

4. Reissue new passes to users who should retain access:

```bash
npm run access:manage -- issue --kind temporary --label "QA tester"
npm run access:manage -- issue --kind permanent --label "Design partner"
```

To limit the blast radius of a future revocation, prefer **temporary passes**
(14-day expiry) over permanent passes whenever practical. Temporary passes
self-expire without requiring a key rotation.

## Important Limitations

- This is an offline access gate, not full DRM
- There is no per-pass remote revocation; the only revocation mechanism is key rotation plus redeploy
- Deleting or retiring a registry entry does not invalidate copies already shared
- The strongest reset is key rotation plus redeploy plus reissuing passes

## Quick Decision Table

- Generated a new pass: no rebuild, no redeploy
- Deleted or pruned registry entries: no rebuild, no redeploy
- Rotated keypair: redeploy required
- Changed `src/access/public-key.ts`: redeploy required
- Changed access-gate UI or logic: redeploy required
- Pushed code to `main` on a Vercel-connected project: Vercel deploys automatically
