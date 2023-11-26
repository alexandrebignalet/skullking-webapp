<script lang="ts">
  import type { load as experimentLoad } from "./+page.server.js";
  import type { load as layoutLoad } from "../+layout.server.js";

  export let data: Awaited<ReturnType<typeof experimentLoad>> & Awaited<ReturnType<typeof layoutLoad>>;
</script>

<main>
  <table style="width: 100%; text-align: center">
    <thead>
    <tr>
      <th>created at</th>
      <th>id</th>
      <th>players count</th>
      <th>repartitions</th>
    </tr>
    </thead>
    <tbody>
    {#each data.experiments as experiment}
      <tr>
        <td>{new Date(experiment.createdAt).toLocaleDateString()}</td>
        <td><a href={`experiments/${experiment.id}`}>{experiment.id}</a></td>
        <td>{experiment.playersCount}</td>
        <td>
          {#each Object.entries(experiment.botRepartition) as [strategy, count]}
            <p>{strategy}: {count}</p>
          {/each}
        </td>
      </tr>
    {/each}
    </tbody>
  </table>
</main>