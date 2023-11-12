<script lang="ts">
  import type { load } from "./+layout.server.js";
  import { writable } from "svelte/store";
  import { setContext } from "svelte";

  export let data: Awaited<ReturnType<typeof load>>;

  type UserStore = {}

  const user = writable<UserStore>();
  $: user.set(data.user);
  setContext("user", user);
</script>

<aside>
  {#if !!data.user}
    <h2>Bonjour {data.user.userName}</h2>

  {:else}
    <h2>S'enregistrer</h2>
  {/if}

  <ul>

  </ul>
</aside>

<main>
  <slot />
</main>
