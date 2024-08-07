import type { Database } from "$lib/database.types"
import type { Octokit } from "@octokit/rest"
import type { Session, SupabaseClient, User } from "@supabase/supabase-js"

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
      safe_session: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: User | null
      octokit: Octokit
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
