<script lang="ts">
  import Repo from "./Repo.svelte"
  import * as Tabs from "$lib/components/ui/tabs/index.js"
  import Save from "lucide-svelte/icons/save"
  import Star from "lucide-svelte/icons/star"
  import RepoForm from "$lib/components/RepoForm.svelte"

  let { data } = $props()
</script>

<Tabs.Root value="saved">
  <Tabs.List class="mb-2">
    <Tabs.Trigger value="saved" class="flex gap-1.5">
      <Save class="size-4" />
      Saved ({data.saved_length})
    </Tabs.Trigger>
    <Tabs.Trigger value="starred" class="flex gap-1.5">
      <Star class="size-4" />
      Starred ({data.starred_length})
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="saved">
    {#await data.saved}
      <p>Loading...</p>
    {:then saved}
      <ol class="grid grid-cols-2 items-start gap-6 md:grid-cols-3">
        {#each saved as repo}
          <li>
            <Repo {repo} editable />
          </li>
        {/each}
      </ol>
    {/await}
    {#if data.session}
      <RepoForm />
    {/if}
  </Tabs.Content>
  <Tabs.Content value="starred">
    {#await data.starred}
      <p>Loading...</p>
    {:then starred}
      <ol class="grid grid-cols-2 items-start gap-6 md:grid-cols-3">
        {#each starred as repo}
          <li>
            <Repo {repo} />
          </li>
        {/each}
      </ol>
    {/await}
  </Tabs.Content>
</Tabs.Root>
