import { createServerClient } from "@supabase/ssr"
import { type Handle, redirect } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import type { SetOptional } from "type-fest"

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import { Octokit } from "@octokit/rest"
import { GITHUB_TOKEN } from "$env/static/private"

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: "/" })
        })
      },
    },
  })

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safe_session = async function () {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }

    const session_without_user: SetOptional<typeof session, "user"> = session
    delete session_without_user.user

    return { session: Object.assign({}, session, { user }), user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === "content-range" || name === "x-supabase-api-version"
    },
  })
}

const guard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safe_session()
  event.locals.session = session
  event.locals.user = user

  if (!event.locals.session && event.url.pathname.startsWith("/private")) {
    redirect(303, "/auth")
  }

  if (event.locals.session && event.url.pathname === "/auth") {
    redirect(303, "/private")
  }

  return resolve(event)
}

const octokit: Handle = async ({ event, resolve }) => {
  event.locals.octokit = new Octokit({
    auth: event.locals.session ? event.locals.session.provider_token : GITHUB_TOKEN,
  })

  return resolve(event)
}

export const handle: Handle = sequence(supabase, octokit, guard)
