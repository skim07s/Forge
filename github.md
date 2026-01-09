# Git & GitHub Command Reference

## 🚀 Initial Setup

```bash
# Configure your identity (one-time setup)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Check your configuration
git config --list
```

## 📦 Starting a Repository

```bash
# Initialize a new repository
git init

# Clone an existing repository
git clone https://github.com/username/repo-name.git

# Add remote origin
git remote add origin https://github.com/username/repo-name.git

# View remote URLs
git remote -v
```

## 💾 Basic Workflow

```bash
# Check status of files
git status

# Add files to staging
git add filename.js           # Add specific file
git add .                     # Add all files
git add -A                    # Add all changes

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes from GitHub
git pull origin main
```

## 🌿 Branching

```bash
# View all branches
git branch

# Create a new branch
git branch branch-name

# Switch to a branch
git checkout branch-name

# Create and switch to new branch (shortcut)
git checkout -b branch-name

# Rename current branch
git branch -M new-name

# Delete a branch (local)
git branch -d branch-name

# Delete a branch (force)
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name

# Push new branch to GitHub
git push origin branch-name

# Set upstream for new branch
git push -u origin branch-name
```

## 🔀 Merging

```bash
# Merge a branch into current branch
git merge branch-name

# Abort a merge (if conflicts)
git merge --abort

# Continue after resolving conflicts
git add .
git commit -m "Resolve merge conflicts"
```

## 📜 History & Logs

```bash
# View commit history
git log

# View compact log
git log --oneline

# View last 5 commits
git log -5

# View changes in a commit
git show commit-hash

# View file changes
git diff

# View staged changes
git diff --staged
```

## ↩️ Undoing Changes

```bash
# Unstage a file (keep changes)
git restore --staged filename

# Discard changes in working directory
git restore filename

# Discard all local changes
git restore .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a specific commit (creates new commit)
git revert commit-hash
```

## 🔍 Checking & Comparing

```bash
# Check difference between branches
git diff main..feature-branch

# See files changed in last commit
git show --name-only

# List all commits by author
git log --author="Your Name"

# Search commits by message
git log --grep="keyword"
```

## 🏷️ Tags (Versioning)

```bash
# Create a tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Version 1.0.0"

# List all tags
git tag

# Push tag to GitHub
git push origin v1.0.0

# Push all tags
git push origin --tags

# Delete a tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

## 🧹 Cleaning Up

```bash
# Remove untracked files
git clean -f

# Remove untracked files and directories
git clean -fd

# Preview what will be removed
git clean -n

# Remove files from git but keep locally
git rm --cached filename
```

## 🔄 Stashing (Temporary Storage)

```bash
# Save current work temporarily
git stash

# Save with a message
git stash save "Work in progress"

# List all stashes
git stash list

# Apply most recent stash
git stash apply

# Apply and remove stash
git stash pop

# Remove most recent stash
git stash drop

# Clear all stashes
git stash clear
```

## 🚨 Emergency Commands

```bash
# Force push (use carefully!)
git push --force origin main

# Pull and overwrite local changes
git fetch origin
git reset --hard origin/main

# Undo last push (if no one else pulled)
git reset --hard HEAD~1
git push --force origin main
```

## 🔧 Common Workflows

### **Starting New Feature**

```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

### **Merging Feature to Main**

```bash
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main
git branch -d feature/new-feature
```

### **Updating Your Branch with Latest Main**

```bash
git checkout feature-branch
git fetch origin
git merge origin/main
# OR rebase (cleaner history)
git rebase origin/main
```

### **Fixing Last Commit Message**

```bash
git commit --amend -m "New commit message"
git push --force origin branch-name
```

### **Moving Uncommitted Work to New Branch**

```bash
git stash
git checkout -b new-branch
git stash pop
```

## 🎯 Best Practices

- ✅ Commit often with clear messages
- ✅ Pull before you push
- ✅ Use branches for features
- ✅ Write descriptive commit messages
- ✅ Review changes before committing (`git diff`)
- ❌ Don't commit large binary files
- ❌ Don't force push to shared branches
- ❌ Don't commit sensitive data (passwords, API keys)

## 📝 Commit Message Convention

```bash
# Good commit messages
git commit -m "Add user authentication feature"
git commit -m "Fix calendar date selection bug"
git commit -m "Update README with installation steps"
git commit -m "Refactor habit store for better performance"

# Common prefixes
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code formatting
refactor: Code restructuring
test: Adding tests
chore: Maintenance tasks
```

## 🔗 Useful Aliases (Optional Setup)

```bash
# Add shortcuts to git
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'restore --staged'

# Now you can use:
git st        # instead of git status
git co main   # instead of git checkout main
```

---

**Need Help?**

- `git --help` - General help
- `git <command> --help` - Help for specific command
- [GitHub Docs](https://docs.github.com/)
