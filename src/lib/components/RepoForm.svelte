<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js"
  import { Label } from "$lib/components/ui/label/index.js"
  import { Input } from "$lib/components/ui/input/index.js"
  import { Switch } from "$lib/components/ui/switch/index.js"
  import { enhance } from "$app/forms"
  import { cn } from "$lib/utils"
  import { toast } from "svelte-sonner"
  import { buttonVariants, Button } from "$lib/components/ui/button/index.js"
  import type { Repository } from "$lib/types"
  import { invalidateAll } from "$app/navigation"

  interface Props {
    open?: boolean
    repo?: Repository
  }

  let { open = $bindable(), repo }: Props = $props()
  let is_duplicate = $state(false)
</script>

<Dialog.Root bind:open>
  {#if !repo}
    <Dialog.Trigger class={cn(buttonVariants(), "mt-8")}>Add Repository</Dialog.Trigger>
  {/if}
  <Dialog.Content class="sm:max-w-[425px]">
    <form
      method="POST"
      action="/?/{repo ? 'update' : 'add'}"
      use:enhance={() => {
        return async function ({ result }) {
          if (result.type === "success") {
            open = false
            invalidateAll()

            if (repo) {
              toast.success("Repository updated", {
                description: "The repository has been updated successfully.",
              })
            } else {
              toast.success("Repository added", {
                description: "The repository has been added successfully.",
              })
            }

            return
          }

          if (result.type === "failure") {
            if (result.data?.code === "23505") {
              toast.error("Repository already added", {
                description: "This repository is already being watched.",
              })

              is_duplicate = true
            } else {
              toast.error("Failed to add repository", {
                description: result.data?.message === "string" ? result.data?.message : "An error occurred.",
              })
            }
          }
        }
      }}
    >
      {#if repo}
        <input type="hidden" name="id" value={repo.supa.id} />
      {/if}
      <Dialog.Header>
        {#if repo}
          <Dialog.Title>Edit {repo.details.full_name}</Dialog.Title>
          <Dialog.Description>Edit the details of the repository.</Dialog.Description>
        {:else}
          <Dialog.Title>Add a repository</Dialog.Title>
          <Dialog.Description>Add a GitHub repository to watch for releases.</Dialog.Description>
        {/if}
      </Dialog.Header>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="url" class={cn("text-right", { "text-destructive": is_duplicate })}>URL</Label>
          <Input
            name="url"
            id="url"
            class={cn("col-span-3", { "border-destructive": is_duplicate })}
            required
            type="url"
            value={repo?.details.html_url}
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="prerelease" class="text-right">Prerelease</Label>
          <Switch name="prerelease" id="prerelease" class="col-span-3" checked={repo?.supa.prerelease} />
        </div>
      </div>
      <Dialog.Footer>
        <Button type="submit">
          {repo ? "Update" : "Add"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
