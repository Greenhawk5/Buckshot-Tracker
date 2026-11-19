import os
import glob
import re
import yaml
import urllib.parse

print("--- Checking YAML files ---")
yaml_files = glob.glob(".github/**/*.yml", recursive=True) + ["CITATION.cff"]
for yf in yaml_files:
    try:
        with open(yf, "r", encoding="utf-8") as f:
            yaml.safe_load(f)
        print("VALID YAML:", yf)
    except Exception as e:
        print("YAML ERROR in", yf, ":", e)

print("\n--- Checking relative markdown links ---")
md_files = glob.glob("**/*.md", recursive=True)
broken_links = []
for mf in md_files:
    if "node_modules" in mf:
        continue
    with open(mf, "r", encoding="utf-8") as f:
        content = f.read()
    links = re.findall(r'\[(?:[^\]]*)\]\(([^)]+)\)', content)
    img_links = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
    for link in links + img_links:
        link_target = urllib.parse.unquote(link.split("#")[0])
        if not link_target or link_target.startswith("http") or link_target.startswith("mailto:"):
            continue
        base_dir = os.path.dirname(mf)
        resolved = os.path.normpath(os.path.join(base_dir, link_target))
        if not os.path.exists(resolved):
            broken_links.append((mf, link, resolved))

if broken_links:
    print("Broken links found:", broken_links)
else:
    print("All relative markdown links and image sources are valid!")

print("\n--- Checking for accidental secrets ---")
potential_secrets = []
secret_patterns = [
    r'bot[0-9]{8,10}:[a-zA-Z0-9_-]{35}',
    r'ghp_[a-zA-Z0-9]{36}',
    r'-----BEGIN [A-Z]+ PRIVATE KEY-----',
    r'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+',
]

tracked_files = [
    f for f in glob.glob("**/*", recursive=True)
    if os.path.isfile(f) and "node_modules" not in f and ".git" not in f and ".tgcloud" not in f
]

for tf in tracked_files:
    try:
        with open(tf, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        for pat in secret_patterns:
            if re.search(pat, content):
                potential_secrets.append((tf, pat))
    except Exception:
        pass

if potential_secrets:
    print("WARNING: Potential secrets found:", potential_secrets)
else:
    print("Zero secrets or tokens found across repository files!")
