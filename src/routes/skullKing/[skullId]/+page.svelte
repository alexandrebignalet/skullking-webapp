<script lang="ts">
    import type { load as skullKingLoad } from "./+page.server";
    import type { load as layoutLoad } from "../../+layout.server";
    import { onMount } from "svelte";
    import type { SkullKing } from "$lib/domain/skullKing";
    import { skullKingPhases } from "$lib/domain/skullKing";
    import { writable } from "svelte/store";
    import type { CommandResult } from "$lib/command-invocation";
    import { invalidate } from "$app/navigation";
    import type { SkullKingEvent } from "$lib/domain/events";
    import { skullKingEventSchema } from "$lib/domain/events";
    import {
        animationTimeouts,
        resolveSkullKingUiStateTransition,
        skullKingUiStateReducerBuildersByTransition
    } from "$lib/ui/skullKing/skull-king-ui-state";
    import { browser } from "$app/environment";
    import type { TimeoutableError } from "$lib/ui/error/timeoutable-error";
    import { eventStore } from "$lib/ui/skullKing/event-store";
    import { errorStore } from "$lib/ui/error/error-store";

    export let data: Awaited<ReturnType<typeof skullKingLoad>> & Awaited<ReturnType<typeof layoutLoad>>;

    const currentUser = data.user;

    let errors: TimeoutableError[] = [];
    const { pushError, unsubscribe: errorStoreUnsub } = errorStore((e) => {
        errors = e;
    });


    let eventsCollected: SkullKingEvent[] = [];
    const { startEventsCollection, stopEventsCollection, collectEvent, unsubscribe } = eventStore(({ events }) => {
        eventsCollected = events;
    });

    let skullKingState: SkullKing = data.skullKing;
    const skullKingStore = writable<SkullKing>(data.skullKing);
    $: skullKingStore.set(data.skullKing);

    const skullKingStoreUnsub = skullKingStore.subscribe(async (value: SkullKing) => {
        if (!browser) {
            return;
        }

        const stateTransition = resolveSkullKingUiStateTransition(skullKingState, value);
        const builder = skullKingUiStateReducerBuildersByTransition[stateTransition];
        const reducers = builder(eventsCollected, animationTimeouts);

        stopEventsCollection();

        await reducers.reduce(
            (acc, { reducer, timeout }) => acc
                .then(() => new Promise<void>((resolve) =>
                    window.setTimeout(() => {
                            skullKingState = reducer(skullKingState, value);
                            resolve();
                        },
                        timeout
                    )
                )),
            Promise.resolve()
        );
    });

    $: currentUserPlayer = skullKingState.players.find(player => player.id === currentUser?.id);
    $: currentPlayerCardsCount = (currentUserPlayer?.cardIds.length || 0) + 1;
    $: announceValues = [...new Array(currentPlayerCardsCount).keys()];

    $: roundsPlayed = skullKingState.scoreBoard[currentUser?.id].length;
    $: roundsPlayedRange = [...new Array(roundsPlayed).keys()];

    const playerName = (playerId: string) => skullKingState.players.find(player => player.id === playerId)?.name;
    const cumulatedScoreOf = (playerId: string, roundNb: number) => skullKingState.scoreBoard[playerId].filter((rs) => rs.roundNb <= roundNb).reduce((acc, roundScore) => acc + roundScore.score, 0);

    onMount(() => {
        const ws = new WebSocket(`${data.wsBaseUrl}/skullKing/${data.skullKing.id}/subscribe`);

        ws.addEventListener("open", () => {
            console.log("connected");
        });

        ws.addEventListener("close", () => {
            window.location.reload();
        });

        ws.addEventListener("error", (err) => {
            console.log("error", err);
            window.location.reload();
        });

        ws.addEventListener("message", ({ data: rawEvent }: {
            data: string
        }) => {
            const event: SkullKingEvent = skullKingEventSchema.parse(JSON.parse(rawEvent));

            collectEvent(event);

            invalidate("skullKing");
        });

        return () => {
            ws.close();
            skullKingStoreUnsub();
            errorStoreUnsub();
            unsubscribe();
        };
    });

    const handleAnnounce = async (event: {
        target: EventTarget & HTMLFormElement
    }) => {
        startEventsCollection();
        const response = await fetch("?/announce", {
            method: "POST",
            body: new URLSearchParams({
                announce: event.target.announce.value
            })
        });

        const { error }: CommandResult = await response.json();

        if (error) {
            stopEventsCollection();
            pushError(error);
        }
    };

    const handlePlay = async (event: {
        target: EventTarget & HTMLFormElement
    }) => {
        startEventsCollection();
        const response = await fetch("?/play", {
            method: "POST",
            body: new URLSearchParams({
                usage: event.target.usage?.value,
                cardId: event.target.cardId.value
            })
        });

        const { error }: CommandResult = await response.json();

        if (error) {
            stopEventsCollection();
            pushError(error);
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
            <form method="post" on:submit|preventDefault={handleAnnounce}>
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
            {#each Object.keys(skullKingState.scoreBoard) as playerId}
                <th>{playerName(playerId)}</th>
            {/each}
        </tr>
        </thead>
        <tbody>
        {#each roundsPlayedRange as round}
            <tr>
                <td>{round + 1}</td>
                {#each Object.keys(skullKingState.scoreBoard) as playerId}
                    <th>
                        {cumulatedScoreOf(playerId, round + 1)} -
                        ({skullKingState.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.announced}
                        |
                        {skullKingState.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.done}
                        |
                        {skullKingState.scoreBoard[playerId].find((roundScore) => roundScore.roundNb === round + 1)?.potentialBonus}
                        )
                    </th>
                {/each}
            </tr>
        {/each}
        </tbody>
    </table>


</main>