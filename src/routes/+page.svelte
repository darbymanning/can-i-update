<script lang="ts">
  import Repo from "./Repo.svelte"
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js"
  import * as Dialog from "$lib/components/ui/dialog/index.js"
  import * as Tabs from "$lib/components/ui/tabs/index.js"
  import { Label } from "$lib/components/ui/label/index.js"
  import { Input } from "$lib/components/ui/input/index.js"
  import { Switch } from "$lib/components/ui/switch/index.js"
  import { enhance } from "$app/forms"
  import { cn } from "$lib/utils"
  import Save from "lucide-svelte/icons/save"
  import Star from "lucide-svelte/icons/star"

  let { data } = $props()
</script>

<Tabs.Root value="saved">
  <Tabs.List class="mb-2">
    <Tabs.Trigger value="saved" class="flex gap-1.5">
      <Save class="size-4" />
      Saved ({data.saved.length})
    </Tabs.Trigger>
    <Tabs.Trigger value="starred" class="flex gap-1.5">
      <Star class="size-4" />
      Starred ({data.starred.length})
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="saved">
    <ol class="grid grid-cols-2 items-start gap-6 md:grid-cols-3">
      {#each data.saved as repo}
        <li>
          <Repo {...repo} />
        </li>
      {/each}
    </ol>

    {#if data.session}
      <Dialog.Root>
        <Dialog.Trigger class={cn(buttonVariants(), "mt-8")}>Add Repository</Dialog.Trigger>
        <Dialog.Content class="sm:max-w-[425px]">
          <form method="POST" action="/?/add" use:enhance>
            <Dialog.Header>
              <Dialog.Title>Add a repository</Dialog.Title>
              <Dialog.Description>Add a GitHub repository to watch for releases.</Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="url" class="text-right">URL</Label>
                <Input name="url" id="url" class="col-span-3" required type="url" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="prerelease" class="text-right">Prerelease</Label>
                <Switch name="prerelease" id="prerelease" class="col-span-3" />
              </div>
            </div>
            <Dialog.Footer>
              <Button type="submit">Add Repository</Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    {/if}
  </Tabs.Content>
  <Tabs.Content value="starred">
    <ol class="grid grid-cols-2 items-start gap-6 md:grid-cols-3">
      {#each data.starred as repo}
        <li>
          <Repo {...repo} />
        </li>
      {/each}
    </ol>
  </Tabs.Content>
</Tabs.Root>
