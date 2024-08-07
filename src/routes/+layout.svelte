<script lang="ts">
  import "../app.css"
  import { enhance } from "$app/forms"
  import { invalidate } from "$app/navigation"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
  import * as Avatar from "$lib/components/ui/avatar/index.js"
  import { Button } from "$lib/components/ui/button/index.js"
  import { Toaster } from "$lib/components/ui/sonner"

  let { children, data } = $props()

  $effect(() => {
    const auth = data.supabase.auth.onAuthStateChange((_, new_session) => {
      if (new_session?.expires_at !== data.session?.expires_at) {
        invalidate("supabase:auth")
      }
    })

    return auth.data.subscription.unsubscribe
  })
</script>

{#snippet user_menu()}
  {#if data.session}
    {@const metadata = data.session.user.user_metadata}

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="ghost" builders={[builder]} class="relative size-8 rounded-full">
          <Avatar.Root class="size-8">
            <Avatar.Image src={metadata.avatar_url} alt={metadata.preferred_username} />
            <Avatar.Fallback>{metadata.full_name.slice(0, 1)}</Avatar.Fallback>
          </Avatar.Root>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-56" align="end">
        <DropdownMenu.Label class="font-normal">
          <div class="flex flex-col space-y-1">
            <p class="text-sm font-medium leading-none">{metadata.full_name}</p>
            <p class="text-xs leading-none text-muted-foreground">{metadata.email}</p>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => data.supabase.auth.signOut()}>Log out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <form method="POST" action="/?/login" use:enhance>
      <button>Login with GitHub</button>
    </form>
  {/if}
{/snippet}

<Toaster />

<div class="container my-10 grid gap-10">
  <header class="grid grid-cols-[1fr_auto] gap-10">
    <h1 class="text-2xl font-bold">Can I update?</h1>
    {@render user_menu()}
  </header>

  <main>
    {@render children()}
  </main>
</div>
