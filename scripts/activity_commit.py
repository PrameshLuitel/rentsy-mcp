#!/usr/bin/env python3
"""Generate natural-looking commits (3-21 per run, spread across ~8h)."""
import os, random, datetime, subprocess

REPO = os.path.expanduser('~/rentsy-mcp')
os.chdir(REPO)

subprocess.run(['git', 'pull', '--rebase'], capture_output=True)

COMMITS = random.randint(3, 21)
base_hour = 8
commit_messages = [
    'chore: update activity heartbeat',
    'chore: automated data refresh',
    'chore: sync latest changes',
    'chore: periodic maintenance',
    'chore: update scraped timestamps',
    'chore: daily data sync',
    'chore: minor updates',
]

for i in range(COMMITS):
    offset_hours = (i * random.randint(20, 50)) // 60
    hour = base_hour + offset_hours
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    today = datetime.date.today()
    ts = datetime.datetime(today.year, today.month, today.day, hour, minute, second)
    date_str = ts.strftime('%Y-%m-%d %H:%M:%S')

    with open(os.path.join(REPO, 'scripts', '.heartbeat'), 'a') as f:
        f.write(f'{ts.isoformat()} | commit-{i+1} | seed={random.getrandbits(16)}\n')

    subprocess.run(['git', 'add', 'scripts/.heartbeat'], capture_output=True)
    msg = random.choice(commit_messages)
    env = os.environ.copy()
    env['GIT_AUTHOR_DATE'] = date_str
    env['GIT_COMMITTER_DATE'] = date_str
    subprocess.run(['git', 'commit', '-m', msg], env=env, capture_output=True)
    subprocess.run(['sleep', str(random.randint(2, 10))])

subprocess.run(['git', 'push'], capture_output=True)
print(f'Pushed {COMMITS} commits for {datetime.date.today()}')
