<script lang="ts">
  import type { load } from "./+layout.server.js";

  export let data: Awaited<ReturnType<typeof load>>;
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

<aside>
  <h2>More posts</h2>
  <ul>

  </ul>
</aside>