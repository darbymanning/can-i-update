import type { Database } from "$lib/database.types.js"
import { fail, redirect } from "@sveltejs/kit"

type Repo = Database["public"]["Tables"]["repos"]["Row"]

async function get_repo_details({ octokit, repo_list }: { octokit: App.Locals["octokit"]; repo_list: Array<Repo> }) {
  const repos = []

  for (const repo of repo_list) {
    const [{ data: releases }, { data: details }] = await Promise.all([
      octokit.repos.listReleases({ owner: repo.owner, repo: repo.repo, per_page: 100 }),
      octokit.repos.get({ owner: repo.owner, repo: repo.repo }),
    ])

    const latest_release = releases.find((release) => (repo.prerelease ? true : !release.prerelease))

    repos.push({ details, releases, latest_release, supa: repo })
  }

  return repos
}

export async function load({ locals: { session, supabase, octokit }, depends }) {
  depends("supabase:auth")

  const default_repo_list: Array<Repo> = [
    {
      id: 1,
      order: 1,
      owner: "sveltejs",
      repo: "kit",
      prerelease: false,
    },
  ]

  let repo_list = default_repo_list

  if (session) {
    const { data } = await supabase.from("repos").select().order("order")
    if (data) repo_list = data
  }

  const { data: starred } = await octokit.activity.listReposStarredByAuthenticatedUser()

  return {
    saved_length: repo_list.length,
    saved: get_repo_details({ octokit, repo_list }),
    starred_length: starred.length,
    starred: get_repo_details({
      octokit,
      repo_list: starred.map((repo, index) => ({
        ...repo,
        order: index,
        owner: repo.owner.login,
        repo: repo.name,
        prerelease: false,
      })),
    }),
  }
}

function form_data(data: FormData) {
  const [url, prerelease, id] = [
    data.get("url") as string,
    data.get("prerelease"),
    data.get("id") as string | undefined,
  ]

  const owner = url.split("/")[3]
  const repo = url.split("/")[4]

  return { owner, repo, prerelease: !!prerelease, id }
}

export const actions = {
  async login({ locals: { supabase }, url }) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: new URL("auth/callback", url.origin).toString() },
    })

    if (data.url) redirect(307, data.url)

    if (error) return fail(400, { error: error.message })
  },
  async add({ request, locals: { supabase, octokit } }) {
    console.log("add")

    const data = await request.formData()

    const { owner, repo, prerelease } = form_data(data)

    try {
      // Ensure repo exists by retrieving it first
      await octokit.repos.get({ owner, repo })

      const result = await supabase.from("repos").insert({ owner, repo, prerelease: !!prerelease })

      if (result.error) return fail(400, result.error)

      return { success: true }
    } catch (error) {
      console.log(error)
      return fail(400, { message: "Repository not found" })
    }
  },
  async update({ request, locals: { supabase } }) {
    const data = form_data(await request.formData())

    if (!data.id) return fail(400, { message: "Repository not found" })

    const result = await supabase
      .from("repos")
      .update({
        owner: data.owner,
        repo: data.repo,
        prerelease: data.prerelease,
      })
      .eq("id", data.id)

    if (result.error) return fail(400, result.error)

    return { success: true }
  },
  async delete({ request, locals: { supabase } }) {
    const data = await request.formData()
    const id = data.get("id")

    if (!id) return fail(400, { message: "Repository not found" })

    const result = await supabase.from("repos").delete().eq("id", id)

    if (result.error) return fail(400, result.error)

    return { success: true }
  },
}
