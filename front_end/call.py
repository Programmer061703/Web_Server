import requests
import webbrowser

# Post the script
#host = 'http://jacquard.ddns.uark.edu:8985'
host = 'http://gashler.com:8985'
files = {'file': open('main.js', 'rb')}
response = requests.post(f'{host}/redirect.html', files=files)

# Extract the url from the response
s = response.text
prefix = 'script='
beg = s.find(prefix)
s = s[beg + len(prefix):]
end = s.find('\'')
s = s[:end]

# Open the game page in the default browser
webbrowser.open(f'{host}/game.html?script={s}', new=2)