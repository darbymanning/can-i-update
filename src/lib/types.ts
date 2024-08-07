import type { load } from "../routes/+page.server"

export type Repository = Awaited<ReturnType<typeof load>>["repos"][number]
