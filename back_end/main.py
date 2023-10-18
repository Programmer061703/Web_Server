from typing import Mapping, Any
import os
from http_daemon import delay_open_url, serve_pages

def make_ajax_page(params: Mapping[str, Any]) -> Mapping[str, Any]:
    print(f'make_ajax_page was called with {params}')
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
        'ajax.html': make_ajax_page,
    })

if __name__ == "__main__":
    main()
