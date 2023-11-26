<script lang="ts">
  import type { load as experimentLoad } from "./+page.server.js";
  import ScoreBoard from "$lib/ui/skullKing/ScoreBoard.svelte";
  import { winner } from "$lib/domain/skullKing";

  export let data: Awaited<ReturnType<typeof experimentLoad>>;
  $: experimentWinner = data.skullKing ? winner(data.skullKing) : undefined;
</script>

<main>
  {#if data.error}
    {data.error}
  {/if}

  {#if data.experiment}
    <div>
      <h1>{data.experiment.id} | {new Date(data.experiment.createdAt).toLocaleDateString()}</h1>
      {#each Object.entries(data.experiment.botRepartition) as [strategy, count]}
        <p>{strategy}: {count}</p>
      {/each}


      {#if !data.skullKing}
        <p>experiment running</p>
      {:else}
        <p>experiment
          {#if data.skullKing.isEnded}
            ended
          {:else}
            inprogress
          {/if}
        </p>
        <p>skullKing: {data.skullKing.id}</p>
        <p>Won by {experimentWinner?.name}: {experimentWinner?.score}</p>
        <ScoreBoard skullKing={data.skullKing} />
      {/if}
    </div>
  {/if}
</main>