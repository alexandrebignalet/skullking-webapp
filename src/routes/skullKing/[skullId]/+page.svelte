<script lang="ts">
  import type { actions, load } from "./+page.server";
  import { getContext } from "svelte";
  import { cardTypes, skullKingPhases } from "$lib/domain/skullKing";
  import { isDomainError } from "$lib/domain/domain-error";

  export let data: Awaited<ReturnType<typeof load>>;
  export let form: Awaited<ReturnType<typeof actions.announce | typeof actions.play>> | undefined;

  const currentUser = getContext("user");

  const currentUserPlayer = data.skullKing.players.find(player => player.id === $currentUser.id);
  const currentPLayerCardsCount = (currentUserPlayer?.cards.length || 0) + 1;
  const announceValues: number[] = [...new Array(currentPLayerCardsCount).keys()];

  const formError = isDomainError(form?.error) ? form?.error.message : form?.error;
  const roundsPlayed = data.skullKing.scoreBoard[$currentUser.id].length;
  const roundsPlayedRange = [...new Array(roundsPlayed).keys()];

  const playerName = (playerId: string) => data.skullKing.players.find(player => player.id === playerId)?.name;
  const cumulatedScoreOf = (playerId: string, roundNb: number) => data.skullKing.scoreBoard[playerId].filter((rs) => rs.roundNb <= roundNb).reduce((acc, roundScore) => acc + roundScore.score, 0);
</script>

<main>
  {#if formError }
    <p>{formError}</p>
  {/if}

  {#if data.skullKing.isEnded }
    <p>Game over</p>
  {/if}

  <ul>
    {#each data.skullKing.players as player}
      <li>
        {player.name}
        {#if player.id === data.skullKing.currentPlayerId }
          *
        {/if}
      </li>
    {/each}
  </ul>

  <ul>
    {#each data.skullKing.fold as play}
      <li>{play.playerId}: {play.card.id}</li>
    {/each}
  </ul>

  {#if data.skullKing.phase === skullKingPhases.ANNOUNCEMENT}
    {#each announceValues as availableAnnounce}
      <form method="post" action="?/announce">
        <input type="hidden" name="announce" value="{availableAnnounce}" />
        <button type="submit">{availableAnnounce}</button>
      </form>
    {/each}
  {/if}

  <ul>
    {#each (currentUserPlayer?.cards || []) as card}
      <li>
        {#if data.skullKing.phase === skullKingPhases.CARDS}
          <form method="post" action="?/play">
            <input type="hidden" name="cardId" value="{card.id}" />
            {#if card.type === cardTypes.SCARY_MARY}
              <select name="usage">
                <option value="PIRATE">pirate</option>
                <option value="ESCAPE">escape</option>
              </select>
            {/if}
            <button type="submit">{card.id}</button>
          </form>
        {:else }
          {card.id}
        {/if}
      </li>
    {/each}
  </ul>

  <table>
    <thead>
    <tr>
      <th>Round/Player</th>
      {#each Object.keys(data.skullKing.scoreBoard) as playerId}
        <th>{playerName(playerId)}</th>
      {/each}
    </tr>
    </thead>
    <tbody>
    {#each roundsPlayedRange as round}
      <tr>
        <td>{round + 1}</td>
        {#each Object.keys(data.skullKing.scoreBoard) as playerId}
          <th>
            {cumulatedScoreOf(playerId, round + 1)} -
            ({data.skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.announced} |
            {data.skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.done} |
            {data.skullKing.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.potentialBonus}
            )
          </th>
        {/each}
      </tr>
    {/each}
    </tbody>
  </table>
</main>