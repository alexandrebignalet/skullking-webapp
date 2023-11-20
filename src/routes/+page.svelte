<script lang="ts">
  import type { actions, load as roomLoad } from "./+page.server.js";
  import type { load as layoutLoad } from "./+layout.server.js";
  import type { User } from "$lib/server/user/user";
  import RoomListItem from "$lib/ui/room/RoomListItem.svelte";

  export let data: Awaited<ReturnType<typeof roomLoad>> & Awaited<ReturnType<typeof layoutLoad>>;
    export let form: Awaited<ReturnType<
        typeof actions.create
        | typeof actions.bots
        | typeof actions.join
        | typeof actions.launch
    >> | undefined;

    const currentUser: User | undefined = data.user;
</script>

<main>
    <h1>SkullKing</h1>
    {#if !!data.error}
        <p>{data.error}</p>
    {:else}


        {#if form && !form.success}
            <p>{form.error}</p>
        {/if}

        <p>Welcome {currentUser?.userName}</p>

        <form method="post" action="?/create">
            <button type="submit">New</button>
        </form>

        <ul>
            {#each data.rooms as room}
                <RoomListItem room={room} />
            {/each}
        </ul>
    {/if}
    <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
</main>