"""Run after building: python3 scripts/check-duaa.py"""
from pathlib import Path
from html.parser import HTMLParser
root = Path(__file__).resolve().parents[1]
class Check(HTMLParser):
    entries = 0
    audio = 0
    ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id', '').startswith('dua-'):
            assert attrs['id'] not in self.ids
            self.ids.add(attrs['id'])
        if tag == 'details' and attrs.get('class') == 'dua': self.entries += 1
        if tag == 'audio':
            self.audio += 1
            assert (root / 'docs' / attrs['src'].lstrip('/')).is_file(), attrs['src']
check = Check()
check.feed((root / 'docs/duaa/index.html').read_text())
assert check.entries == 212, check.entries
assert check.ids == {f'dua-{i}' for i in range(1, 329)}, len(check.ids)
assert check.audio == 308, check.audio
print(f'Passed: {check.entries} topics; {check.audio} existing audio files.')
