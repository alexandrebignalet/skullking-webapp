<script lang="ts">
  import type { actions, load } from "./+page.server";
  import { getContext, onMount } from "svelte";
  import type { SkullKing } from "$lib/domain/skullKing";
  import { skullKingPhases } from "$lib/domain/skullKing";
  import type { DomainError } from "$lib/domain/domain-error";
  import { isDomainError } from "$lib/domain/domain-error";
  import { writable } from "svelte/store";
  import type { CommandResult } from "$lib/command-invocation";
  import { invalidate } from "$app/navigation";
  import type { SkullKingEvent } from "$lib/domain/events";
  import { skullKingEventSchema } from "$lib/domain/events";
  import { enhance } from "$app/forms";

  export let data: Awaited<ReturnType<typeof load>>;
  export let form: Awaited<ReturnType<typeof actions.announce>>;

  const currentUser = getContext("user");

  type TimeoutableError = {
    id: number;
    message: string;
  }
  const timeoutableError = (error: string) => ({ id: (new Date()).getTime(), message: error });

  let errors: TimeoutableError[] = [];
  const errorStore = writable<TimeoutableError[]>([]);
  $: if (form?.error) {
    addError(form.error);
  }

  const errorStoreUnsub = errorStore.subscribe((value) => {
    errors = value;
  });
  const addError = (error: string | DomainError) => {
    const err = timeoutableError(isDomainError(error) ? error.message : "Something went wrong");
    errorStore.update((actual) => actual.concat(err));
    window.setTimeout(() => {
      errorStore.update((actual) => actual.filter((e) => e.id !== err.id));
    }, 5000);
  };

  let skullKingState: SkullKing;
  const skullKingStore = writable<SkullKing>(data.skullKing);
  $: skullKingStore.set(data.skullKing);
  const skullKingStoreUnsub = skullKingStore.subscribe((value) => {
    skullKingState = value;
  });

  $: currentUserPlayer = skullKingState.players.find(player => player.id === $currentUser.id);
  $: currentPlayerCardsCount = (currentUserPlayer?.cardIds.length || 0) + 1;
  $: announceValues = [...new Array(currentPlayerCardsCount).keys()];

  $: roundsPlayed = data.skullKing.scoreBoard[$currentUser.id].length;
  $: roundsPlayedRange = [...new Array(roundsPlayed).keys()];

  const playerName = (playerId: string) => data.skullKing.players.find(player => player.id === playerId)?.name;
  const cumulatedScoreOf = (playerId: string, roundNb: number) => data.skullKing.scoreBoard[playerId].filter((rs) => rs.roundNb <= roundNb).reduce((acc, roundScore) => acc + roundScore.score, 0);

  onMount(() => {
    const ws = new WebSocket(`${data.wsBaseUrl}/skullKing/${data.skullKing.id}/subscribe`);
    let timeout: number = 0;
    let shouldTakeTimeToSettledFold = false;

    ws.addEventListener("open", () => {
      console.log("connected");
    });

    ws.addEventListener("close", () => {
      console.log("disconnected");
    });

    ws.addEventListener("error", (err) => {
      console.log("error", err);
    });

    ws.addEventListener("message", ({ data: rawEvent }: { data: string }) => {
      let waitingTime = 500;
      const event: SkullKingEvent = skullKingEventSchema.parse(JSON.parse(rawEvent));

      switch (event.type) {
        case "game_finished":
          break;
        case "card_played":
          skullKingStore.update((actual: SkullKing) => ({
            ...actual,
            players: actual.players.map((player) => {
              if (event.playerId !== $currentUser.id) {
                return player;
              }
              return {
                ...player,
                cardIds: player.cardIds.filter((c) => c !== event.cardId)
              };
            }),
            fold: actual.fold
              .filter(({ playerId }) => playerId !== event.playerId)
              .concat(event)
          }));
          break;
        case "fold_settled":
          waitingTime = 2500;
          shouldTakeTimeToSettledFold = true;
          console.log("waaaait");
          break;
        case "player_announced":
          break;
        case "round_finished":
          break;

      }

      if (shouldTakeTimeToSettledFold) {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          invalidate("skullKing");
          console.log(`invalidation asked by ${event.type}`);
          if (event.type === "fold_settled") {
            shouldTakeTimeToSettledFold = false;
          }
        }, waitingTime);
      }
    });

    return () => {
      ws.close();
      skullKingStoreUnsub();
      errorStoreUnsub();
    };
  });

  const handlePlay = async (event: {
    target: EventTarget & HTMLFormElement
  }) => {
    const response = await fetch("?/play", {
      method: "POST",
      body: new URLSearchParams({
        usage: event.target.usage?.value,
        cardId: event.target.cardId.value
      })
    });

    const { error }: CommandResult = await response.json();

    if (error) {
      addError(error);
    }
  };

</script>

<main>

  {#each errors as error}
    <p>{error.message}</p>
  {/each}

  {#if skullKingState.isEnded }
    <p>Game over</p>
  {/if}

  <ul>
    {#each skullKingState.players as player}
      <li>
        {player.name}
        {#if player.id === skullKingState.currentPlayerId }
          *
        {/if}
      </li>
    {/each}
  </ul>

  <ul>
    {#each skullKingState.fold as play}
      <li>{play.playerId}: {play.cardId}</li>
    {/each}
  </ul>

  {#if skullKingState.phase === skullKingPhases.ANNOUNCEMENT}
    {#each announceValues as availableAnnounce}
      <form method="post" action="?/announce" use:enhance>
        <input type="hidden" name="announce" value="{availableAnnounce}" />
        <button type="submit">{availableAnnounce}</button>
      </form>
    {/each}
  {/if}

  <ul>
    {#each (currentUserPlayer?.cardIds || []) as cardId}
      <li>
        {#if skullKingState.phase === skullKingPhases.CARDS}
          <form method="post" on:submit|preventDefault={handlePlay}>
            <input type="hidden" name="cardId" value="{cardId}" />
            {#if cardId === "SCARY_MARY" }
              <select name="usage">
                <option value="PIRATE">pirate</option>
                <option value="ESCAPE">escape</option>
              </select>
            {/if}
            <button type="submit">{cardId}</button>
          </form>
        {:else }
          {cardId}
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