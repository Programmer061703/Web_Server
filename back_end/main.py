from typing import Mapping, Any, List, Tuple, Dict
import os
from http_daemon import delay_open_url, serve_pages

class Player():
        def __init__(self, id:str) -> None:
            self.id = id
            self.x = 0
            self.y = 0
            self.known = 0

players: Dict[str, Player] = {}
history: List[Player] = []

# Find a player by id, creating it if necessary
def find_player(id: str) -> Player:
    if id not in players:
        players[id] = Player(id)
       
        

    return players[id]


def update(payload: Mapping[str, Any]) -> Mapping[str, Any]:
    action = payload['action']
    if action == 'clicked':
         player = find_player(payload["id"])
         player.x = payload["x"]
         player.y = payload["y"]
         history.append(player)
         print(f'Created player {id}')
    elif action == 'updates':
         player = find_player(payload["id"])
         remaining_history = history[player.known:]
         player.known = len(history)
         updates: List[Tuple[str, int, int]] = []
         for i in range(len(remaining_history)):
            player = remaining_history[i]
            updates.append((player.id, player.x, player.y))
         return {
             'updates': updates,
         }
    



    print(f'make_ajax_page was called with {payload}')
    return {
        'message': 'yo momma',
    }

def main() -> None:
    # Get set up
    os.chdir(os.path.join(os.path.dirname(__file__), '../front_end'))

    # Serve pages
    port = 8987
    delay_open_url(f'http://localhost:{port}/game.html', .1)
    serve_pages(port, {
        'ajax.html': update,
    })

if __name__ == "__main__":
    main()
