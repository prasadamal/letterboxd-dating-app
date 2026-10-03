# E2E mobile tests (Maestro)

Maestro flows live in `mobile/.maestro/`. They assume the API is running and a demo user exists.

## Install Maestro

https://maestro.mobile.dev/docs/getting-started/installation

## Run smoke flow

```bash
npm run server   # terminal 1 — API on :4000
cd mobile && npx expo start  # terminal 2 — optional if using cloud device

cd mobile
maestro test .maestro/smoke.yaml
```

Set env for your device:

```bash
export MAESTRO_API_URL=http://10.0.2.2:4000/api
maestro test .maestro/smoke.yaml
```

## CI note

Maestro requires an emulator/simulator. GitHub Actions job is optional — run locally before store submission (see `docs/production/QA_CHECKLIST.md`).
