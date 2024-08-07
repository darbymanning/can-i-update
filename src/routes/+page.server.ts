import { fail, redirect } from "@sveltejs/kit"

type RepoList = Array<{ owner: string; repo: string; prerelease?: boolean }>
async function get_repo_details({ octokit, repo_list }: { octokit: App.Locals["octokit"]; repo_list: RepoList }) {
  const repos = []

  for (const repo of repo_list) {
    const [{ data: releases }, { data: details }] = await Promise.all([
      octokit.repos.listReleases({ ...repo, per_page: 10 }),
      octokit.repos.get(repo),
    ])

    const latest_release = releases.find((release) => (repo.prerelease ? true : !release.prerelease))

    repos.push({ details, releases, latest_release })
  }

  return repos
}

async function get_starred_repos({ octokit }: Pick<App.Locals, "octokit">) {
  const { data: starred } = await octokit.activity.listReposStarredByAuthenticatedUser()

  return await get_repo_details({
    octokit,
    repo_list: starred.map(({ owner, name }) => ({ owner: owner.login, repo: name })),
  })
}

export async function load({ locals: { session, supabase, octokit }, depends }) {
  depends("supabase:auth")

  const default_repo_list = [
    {
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

  return {
    saved: await get_repo_details({ octokit, repo_list }),
    starred: await get_starred_repos({ octokit }),
  }
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
    const data = await request.formData()

    const [url, prerelease] = [data.get("url"), data.get("prerelease")]

    if (!url || typeof url !== "string") return fail(400, { message: "URL is required" })

    const owner = url.split("/")[3]
    const repo = url.split("/")[4]

    try {
      await octokit.repos.get({ owner, repo })

      const result = await supabase.from("repos").insert({ owner, repo, prerelease: !!prerelease })

      if (result.status >= 400) {
        console.error(result.error)
        return fail(400, { message: "Unable to insert repo" })
      }

      return { success: true }
    } catch (error) {
      console.log(error)
      return fail(400, { message: "Repository not found" })
    }
  },
}
