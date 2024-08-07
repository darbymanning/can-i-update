import type { load } from "../routes/+page.server"

export type Repository = Awaited<Awaited<ReturnType<typeof load>>["saved"]>[number]
