import asyncio
import tornado
import os.path
import json
import random
import string
import time

from tornado.options import define, options, parse_command_line

define("port", default=8888, help="run on the given port", type=int)
define("debug", default=True, help="run in debug mode")

class GameState(object):
    def __init__(self):
        self.cond = tornado.locks.Condition()
        self.state = {}
        self.last_updated = None

    def get_current_since(self, last_updated):
        """Returns the current state if it is newer than the given timestamp."""
        if self.last_updated is None:
            return None
        if self.last_updated is None or self.last_updated > last_updated:
            return {"state": self.state, "last_updated": self.last_updated}
        else:
            return None

    def update_state(self, state):
        self.state = state["state"]
        self.last_updated = state["last_updated"]
        self.cond.notify_all()

global_game_states = {}

def get_random_string(length):
    # choose from all lowercase letter
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

def get_new_game_id():
    return get_random_string(6)

def start_game():
    new_game_id = get_new_game_id()
    global_game_states[new_game_id] = GameState()
    return new_game_id

def end_game(game_id):
    final_state = global_game_states[game_id]
    del global_game_states[game_id]
    return final_state

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", 
                    messages=[],#global_message_buffer.cache, 
                    last_updated=1)

class NewGameHandler(tornado.web.RequestHandler):
    """Create a new game and returns the new game id"""
    def post(self):
        new_game_id = start_game()
        self.write(dict(game_id=new_game_id))

class EndGameHandler(tornado.web.RequestHandler):
    """Ends the game and returns the final state"""
    def post(self):
        game_id = self.get_argument("game_id")
        final_state = end_game(game_id)
        self.write(dict(state=final_state))

class StateUpdateHandler(tornado.web.RequestHandler):
    """Update the game state."""
    def post(self):
        game_id = self.get_argument("game_id")
        state = {"state": json.loads(self.get_argument("state")), "last_updated": time.time()}
        if (game_id not in global_game_states):
            print(f"Missing game_id {game_id}")
            return
        global_game_states[game_id].update_state(state)
        self.write(state)

class CurrentStateHandler(tornado.web.RequestHandler):
    """Long-polling request for new messages.

    Waits until new messages are available before returning anything.
    """
    async def post(self):
        game_id = self.get_argument("game_id")
        last_updated = self.get_argument("last_updated", -1)
        if (game_id not in global_game_states):
            print(f"Missing game_id {game_id}")
            return
        new_state = global_game_states[game_id].get_current_since(float(last_updated))
        while new_state is None or new_state == {}:
            # Save the Future returned here so we can cancel it in
            # on_connection_close.
            self.wait_future = global_game_states[game_id].cond.wait()
            try:
                await self.wait_future
            except asyncio.CancelledError:
                return
            new_state = global_game_states[game_id].get_current_since(float(last_updated))
        if self.request.connection.stream.closed():
            return
        self.write(dict(stateMessage=new_state))

    def on_connection_close(self):
        self.wait_future.cancel()

async def main():
    parse_command_line()
    app = tornado.web.Application(
        [
            (r"/", MainHandler),
            (r"/a/game/new", NewGameHandler),
            (r"/a/game/end", EndGameHandler),
            (r"/a/state/update", StateUpdateHandler),
            (r"/a/state/current", CurrentStateHandler),
        ],
        cookie_secret="__TODO:_GEN_ERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
        template_path=os.path.join(os.path.dirname(__file__), "templates"),
        static_path=os.path.join(os.path.dirname(__file__), "static"),
        xsrf_cookies=False,
        debug=options.debug,
    )
    app.listen(options.port)
    print(f"Listening at {options.port}")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
