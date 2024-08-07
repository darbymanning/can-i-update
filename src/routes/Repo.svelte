<script lang="ts">
  import * as Accordion from "$lib/components/ui/accordion/index.js"
  import * as Card from "$lib/components/ui/card/index.js"
  import * as Tabs from "$lib/components/ui/tabs/index.js"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
  import { Badge } from "$lib/components/ui/badge/index.js"
  import type { Repository } from "$lib/types"
  import SvelteMarkdown from "svelte-markdown"
  import Ellipsis from "lucide-svelte/icons/ellipsis-vertical"
  import RepoForm from "$lib/components/RepoForm.svelte"
  import { enhance } from "$app/forms"
  import { invalidateAll } from "$app/navigation"
  import { toast } from "svelte-sonner"

  interface Props {
    repo: Repository
    editable?: boolean
  }

  let { repo, editable }: Props = $props()

  function format_date(date_str: string) {
    const d = new Date(date_str)

    const date = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    })

    return `${date} at ${time}`
  }

  function time_ago(date_str: string) {
    const d = new Date(date_str)
    const now = new Date()

    const diff = now.getTime() - d.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} days ago`
    } else if (hours > 0) {
      return `${hours} hours ago`
    } else if (minutes > 0) {
      return `${minutes} minutes ago`
    } else {
      return `${seconds} seconds ago`
    }
  }

  let edit_open = $state(false)
</script>

<RepoForm {repo} bind:open={edit_open} />
<Card.Root>
  <Card.Header>
    <Card.Title class="flex justify-between">
      <a href={repo.details.html_url} target="_blank" rel="noopener noreferrer">
        {repo.details.full_name}
      </a>
      {#if editable}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Ellipsis class="size-4" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Group>
              <DropdownMenu.Label>Manage</DropdownMenu.Label>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onclick={() => (edit_open = true)}>Edit</DropdownMenu.Item>
              <DropdownMenu.Item>
                <form
                  method="POST"
                  action="/?/delete"
                  use:enhance={() => {
                    return async function ({ result }) {
                      if (result.type === "success") {
                        invalidateAll()

                        toast.success("Repository removed", {
                          description: "The repository has been removed successfully.",
                        })
                      }
                    }
                  }}
                >
                  <input type="hidden" name="id" value={repo.supa.id} />
                  <button>Remove</button>
                </form>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </Card.Title>
    <Card.Description>
      {#if repo.latest_release?.published_at}
        <a href={repo.latest_release.html_url} target="_blank" rel="noopener noreferrer">
          {repo.latest_release.name},
          <time datetime={repo.latest_release.published_at}>
            {time_ago(repo.latest_release.published_at)}
          </time>
          {#if repo.latest_release.prerelease}
            <Badge variant="outline">Pre-release</Badge>
          {/if}
        </a>
      {/if}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if repo.latest_release}
      <Tabs.Root value="latest">
        <Tabs.List class="mb-2">
          <Tabs.Trigger value="latest">Latest Release</Tabs.Trigger>
          <Tabs.Trigger value="more">More Releases</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="latest" class="max-h-56 overflow-auto">
          <div class="prose dark:prose-invert">
            <h2 class="text-xs font-bold uppercase tracking-wider text-foreground">Release notes</h2>
            <SvelteMarkdown source={repo.latest_release?.body} />
          </div>
        </Tabs.Content>
        <Tabs.Content value="more" class="max-h-56 overflow-auto">
          <Accordion.Root>
            {#each repo.releases as release}
              <Accordion.Item value={release.node_id}>
                <Accordion.Trigger>{release.name}</Accordion.Trigger>
                <Accordion.Content>
                  {#if release.published_at}
                    <time class="mb-4 block text-xs text-muted-foreground" datetime={release.published_at}>
                      Published {format_date(release.published_at)}
                    </time>
                  {/if}
                  <div class="prose dark:prose-invert">
                    <SvelteMarkdown source={release.body} />
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            {/each}
          </Accordion.Root>
        </Tabs.Content>
      </Tabs.Root>
    {:else}
      <p class="text-muted-foreground">No releases found</p>
    {/if}
  </Card.Content>
</Card.Root>
