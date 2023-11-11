<script lang="ts">
  import type { load } from "./+page.server.js";

  export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
  <h1>SkullKing</h1>
  {#if !!data.error}
    <p>{data.error}</p>
  {:else}
    <ul>
      {#each data.rooms as room}
        <li>{room.id}</li>
      {/each}
    </ul>
  {/if}
  <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
</main>