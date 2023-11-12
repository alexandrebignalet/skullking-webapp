<script lang="ts">
  import type { actions, load } from "./+page.server.js";
  import { getContext } from "svelte";
  import type { Room } from "$lib/domain/room";
  import { isCreator, isInRoom } from "$lib/domain/room";
  import type { User } from "$lib/server/user/user";

  export let data: Awaited<ReturnType<typeof load>>;
  export let createFormResult: Awaited<ReturnType<typeof actions.create>> | undefined;
  export let addBotFormResult: Awaited<ReturnType<typeof actions.bots>> | undefined;
  export let joinFormResult: Awaited<ReturnType<typeof actions.join>> | undefined;
  export let launchFormResult: Awaited<ReturnType<typeof actions.launch>> | undefined;

  const forms = [createFormResult, addBotFormResult, joinFormResult, launchFormResult];

  const currentUser: User = getContext("user");

  const isCurrentUserInRoom = (room: Room) => isInRoom($currentUser, room);

  const canJoin = (room: Room): boolean => {
    return !isCurrentUserInRoom(room) && !room.isFull;
  };

  const canAddBot = (room: Room) => {
    return isInRoom($currentUser, room) && !room.isFull && !room.isStarted;
  };
  const isCurrentUserCreator = (room: Room) => isCreator($currentUser, room);
  const canEnter = (room: Room): room is Room & { gameId: string } => isCurrentUserInRoom(room) && room.isStarted && !!room.gameId;
  const canLaunch = (room: Room) => isCurrentUserInRoom(room) && !room.isStarted && room.users.length > 1 && isCurrentUserCreator(room);
</script>

<main>
  <h1>SkullKing</h1>
  {#if !!data.error}
    <p>{data.error}</p>
  {:else}

    {#each forms as form}
      {#if form && !form.success}
        <p>{form.error}</p>
      {/if}
    {/each}

    <p>Welcome {$currentUser.userName}</p>

    <form method="post" action="?/create">
      <button type="submit">New</button>
    </form>

    <ul>
      {#each data.rooms as room}
        <li>
          <div>
            <p>{room.id}</p>
            <ul>
              {#each room.users as user}
                <li>
                  {user.name}
                  {#if user.type === 'BOT'}(bot){/if}
                  {#if user.id === room.creator}(creator){/if}
                </li>
              {/each}
            </ul>
            <div>
              {#if canAddBot(room)}
                <form method="post" action="?/bots">
                  <input type="hidden" name="roomId" value={room.id} />
                  <button type="submit">add bot</button>
                </form>
              {/if}

              {#if canJoin(room)}
                <form method="post" action="?/join">
                  <input type="hidden" name="roomId" value={room.id} />
                  <button type="submit">join</button>
                </form>
              {/if}

              {#if canLaunch(room)}
                <form method="post" action="?/launch">
                  <input type="hidden" name="roomId" value={room.id} />
                  <button type="submit">launch</button>
                </form>
              {/if}

              {#if canEnter(room)}
                <a href={`/skullKing/${room.gameId}`}>enter</a>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
  <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
</main>