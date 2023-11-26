<script lang="ts">


  import type { SkullKing } from "$lib/domain/skullKing";

  export let skullKing: SkullKing;

  $: roundsPlayed = skullKing.scoreBoard[Object.keys(skullKing.scoreBoard)[0]].length;
  $: roundsPlayedRange = [...new Array(roundsPlayed).keys()];

  const playerName = (playerId: string) => skullKing.players.find(player => player.id === playerId)?.name;
  const cumulatedScoreOf = (playerId: string, roundNb: number) => skullKing.scoreBoard[playerId].filter((rs) => rs.roundNb <= roundNb).reduce((acc, roundScore) => acc + roundScore.score, 0);
</script>
<table>
  <thead>
  <tr>
    <th>Round/Player</th>
    {#each Object.keys(skullKing.scoreBoard) as playerId}
      <th>{playerName(playerId)}</th>
    {/each}
  </tr>
  </thead>
  <tbody>
  {#each roundsPlayedRange as round}
    <tr>
      <td>{round + 1}</td>
      {#each Object.keys(skullKing.scoreBoard) as playerId}
        <th>
          {cumulatedScoreOf(playerId, round + 1)} -
          ({skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.announced}
          |
          {skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.done}
          |
          {skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.potentialBonus}
          )
        </th>
      {/each}
    </tr>
  {/each}
  </tbody>
</table>