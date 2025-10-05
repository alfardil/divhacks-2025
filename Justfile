dev *args:
    pnpm i -g concurrently && concurrently "just py-dev" "just js-dev" {{args}}

js-dev *args:
    cd js && pnpm i && pnpm run dev {{args}}


py-dev *args:
    cd backend && uvicorn app.main:app --reload {{args}}

gen *args:
    pnpm i -g concurrently && concurrently "cd cli && pnpm run build" "dagger generate DatabaseFunctions {{args}}"