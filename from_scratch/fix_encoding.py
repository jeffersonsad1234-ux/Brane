import re

path = r'D:\BRANPY-AI\from_scratch\generate_mega.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\u2192', '->')
content = content.replace('\u2190', '<-')
content = content.replace('\u2014', '--')
content = content.replace('\u2013', '-')
content = content.replace('\u201c', '"')
content = content.replace('\u201d', '"')
content = content.replace('\u2018', "'")
content = content.replace('\u2019', "'")

# Fix bad quote on line 231
content = content.replace("semper.'),", 'semper."),')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed')
