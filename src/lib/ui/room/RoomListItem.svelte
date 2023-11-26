<script lang="ts">

  import type { Room } from "$lib/domain/room";
  import type { User } from "$lib/server/user/user";
  import { getContext } from "svelte";

  export let room: Room;

  const currentUser: User = getContext("user");

  $: isInRoom = room.users.some((roomUser) => roomUser.id === $currentUser.id);
  $: canJoin = !isInRoom && !room.isFull;
  $: canAddBot = isInRoom && !room.isFull && !room.isStarted;
  $: isCreator = room.creator === $currentUser.id;
  $: canEnter = isInRoom && room.isStarted && !!room.gameId;
  $: canLaunch = isInRoom && !room.isStarted && room.users.length > 1 && isCreator;
</script>

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
      {#if canAddBot}
        <form method="post" action="?/bots">
          <input type="hidden" name="roomId" value={room.id} />
          <select name="strategy" required>
            <option value="Dumbot">dumb</option>
            <option value="NasusBot">nasus</option>
          </select>
          <button type="submit">add bot</button>
        </form>
      {/if}

      {#if canJoin}
        <form method="post" action="?/join">
          <input type="hidden" name="roomId" value={room.id} />
          <button type="submit">join</button>
        </form>
      {/if}

      {#if canLaunch}
        <form method="post" action="?/launch">
          <input type="hidden" name="roomId" value={room.id} />
          <button type="submit">launch</button>
        </form>
      {/if}

      {#if canEnter}
        <a href={`/skullKing/${room.gameId}`}>enter</a>
      {/if}
    </div>
  </div>
</li>
