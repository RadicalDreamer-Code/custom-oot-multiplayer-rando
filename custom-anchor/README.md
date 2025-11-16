# custom-anchor

## Starting the Server

To start the Anchor multiplayer server:

```bash
cd custom-anchor
deno run --allow-net --allow-read --allow-write mod.ts
```

The server will start on port 43385 by default (or the port specified in the `PORT` environment variable).

### Key Commands

Once the server is running, you can use these commands in the terminal:

- `help` - Show all available commands
- `keys` - Enable key listener mode for quick actions
- `stats` - Print server statistics
- `list` - List all rooms and connected clients
- `messageAll <message>` - Send a message to all clients
- `stop` - Stop the server

### Key Listener Mode

Press the following keys in key listener mode:

- `e` - Send emergency broadcast to all clients
- `r` - Send DECREASE_HEALTH packet to all clients
- `t` - Send INCREASE_HEALTH packet to all clients
- `i` - Send questions to all clients
- `q` - Quit key listener mode
