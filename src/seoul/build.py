import pathlib
js='\n'.join(pathlib.Path(f).read_text() for f in ['src/seoul/data.js','src/seoul/endings.js','src/seoul/game.js','src/seoul/events.js','src/seoul/turn.js','src/seoul/ui.js'])
html=pathlib.Path('src/seoul/shell.html').read_text().replace('/*__JS__*/',js)
out=pathlib.Path('public/seoul/index.html'); out.parent.mkdir(exist_ok=True); out.write_text(html)
pathlib.Path('/tmp/seoul_all.js').write_text(js)
print(len(html))
