import subprocess, sys, os

ROOT = r"c:\Users\subbu\OneDrive\Documents\OneDrive\Desktop\CORIZO MINOR"
REMOTE = "https://github.com/SUBRAHMANYA2726/Smart-Inventory-Management-System-CORIZO.git"

def run(cmd, **kwargs):
    print(f"\n>>> {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, **kwargs)
    if result.stdout: print(result.stdout)
    if result.stderr: print(result.stderr)
    return result

# 1. Check if git is initialized
check = run(["git", "rev-parse", "--git-dir"])
if check.returncode != 0:
    print("Initializing git repo...")
    run(["git", "init", "-b", "main"])
else:
    print("Git already initialized.")

# 2. Set git config (safe to run always)
run(["git", "config", "user.email", "subrahmanya2726@gmail.com"])
run(["git", "config", "user.name", "Subrahmanya"])

# 3. Add remote (remove old if exists)
remote_check = run(["git", "remote", "get-url", "origin"])
if remote_check.returncode == 0:
    run(["git", "remote", "set-url", "origin", REMOTE])
else:
    run(["git", "remote", "add", "origin", REMOTE])

# 4. Stage all files
run(["git", "add", "."])

# 5. Show what will be committed
run(["git", "status", "--short"])

# 6. Commit
commit = run(["git", "commit", "-m",
    "feat: Premium enterprise inventory dashboard\n\n"
    "- Complete Notion-inspired UI/UX redesign\n"
    "- Animated inventory canvas background (warehouse icons, barcodes, shelves)\n"
    "- Glassmorphic navbar with sticky positioning\n"
    "- 5 KPI metric cards with hover lift animations\n"
    "- Chart.js analytics: value bar, category donut, trend line\n"
    "- Full CRUD with rich form (SKU, barcode, supplier, image upload)\n"
    "- Modern table: search, sort, filter, pagination, CSV/PDF export\n"
    "- Status badges: Active, Low Stock, Out of Stock, Archived\n"
    "- Green (#16A34A) + White design system with Inter/Manrope/Space Grotesk\n"
    "- Responsive: Desktop → Laptop → Tablet → Mobile\n"
    "- Flask REST API with SQLite (default) + MongoDB Atlas (optional)\n"
    "- Comprehensive README, .gitignore, .env.example, LICENSE\n"
])

if commit.returncode != 0 and "nothing to commit" in (commit.stdout + commit.stderr):
    print("Nothing new to commit — already up to date.")
    sys.exit(0)

# 7. Rename branch to main if needed
run(["git", "branch", "-M", "main"])

print("\n" + "="*60)
print("READY TO PUSH")
print("="*60)
print(f"Remote: {REMOTE}")
print("Run: git push -u origin main")
print("(You may need to enter your GitHub credentials or use a Personal Access Token)")
