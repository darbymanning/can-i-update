<script lang="ts">
  import * as Accordion from "$lib/components/ui/accordion/index.js"
  import * as Card from "$lib/components/ui/card/index.js"
  import * as Tabs from "$lib/components/ui/tabs/index.js"
  import { Badge } from "$lib/components/ui/badge/index.js"
  import type { Repository } from "$lib/types"
  import SvelteMarkdown from "svelte-markdown"

  let { releases, details, latest_release }: Repository = $props()

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
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>
      <a href={details.html_url} target="_blank" rel="noopener noreferrer">
        {details.full_name}
      </a>
    </Card.Title>
    <Card.Description>
      {#if latest_release?.published_at}
        <a href={latest_release.html_url} target="_blank" rel="noopener noreferrer">
          {latest_release.name},
          <time datetime={latest_release.published_at}>
            {time_ago(latest_release.published_at)}
          </time>
          {#if latest_release.prerelease}
            <Badge variant="outline">Pre-release</Badge>
          {/if}
        </a>
      {/if}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if latest_release}
      <Tabs.Root value="latest">
        <Tabs.List class="mb-2">
          <Tabs.Trigger value="latest">Latest Release</Tabs.Trigger>
          <Tabs.Trigger value="more">More Releases</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="latest" class="max-h-56 overflow-auto">
          <div class="prose dark:prose-invert">
            <h2 class="text-xs font-bold uppercase tracking-wider text-foreground">Release notes</h2>
            <SvelteMarkdown source={latest_release?.body} />
          </div>
        </Tabs.Content>
        <Tabs.Content value="more" class="max-h-56 overflow-auto">
          <Accordion.Root>
            {#each releases as release}
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
