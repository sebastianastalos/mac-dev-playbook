# mac-dev-playbook

![Lint](https://github.com/sebastianastalos/mac-dev-playbook/actions/workflows/lint.yml/badge.svg)

Ansible playbook to automate setting up a fresh Mac for development.

## Installation

1. Install Ansible:
   ```bash
   pip3 install ansible
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/sebastianastalos/mac-dev-playbook.git
   cd mac-dev-playbook
   ```

3. Install required Ansible collections (defined in `requirements.yml`):
   ```bash
   make setup
   ```

4. Run the playbook:
   ```bash
   make run
   ```

> **Note:** You will be prompted for your macOS password when the playbook runs (`BECOME` password).

## Manual steps required

Some things can't be automated and must be done before or after running the playbook:

- **Mac App Store** – Sign in before running the playbook. Amphetamine is installed via the App Store.
- **GitHub CLI** – Run `gh auth login` after the playbook to authenticate with GitHub.
- **SSH key** – The playbook generates an SSH keypair at `~/.ssh/id_ed25519`.

## What gets installed

**Apps (Homebrew):**
- Obsidian
- 1Password
- Claude Desktop
- VSCodium
- Docker
- Tailscale
- cmux

**App Store:**
- Amphetamine

**CLI tools (Homebrew):**
- GitHub CLI (`gh`)
- dockutil

**npm:**
- Claude Code (`@anthropic-ai/claude-code`)

## What gets configured

- **macOS** – Hidden files, Finder improvements (column view, extensions, status bar), keyboard repeat, screenshots saved to `~/Screenshots`
- **Git** – User identity, default branch (`main`), `pull.rebase`, global `.gitignore`
- **Dock** – Pins apps in order: Obsidian, VSCodium, Claude, 1Password, cmux
- **SSH** – Generates an `ed25519` keypair if one doesn't exist
- **Shell** – Adds aliases to `~/.zshrc` for git and Docker workflows (see [ALIASES.md](docs/ALIASES.md))
- **cmux** – Deploys `~/.config/cmux/cmux.json` with appearance and notification settings
- **Ghostty** – Configures font (JetBrainsMono Nerd Font), background blur, and tab bar

## Customisation

Edit `group_vars/all.yml` to add or remove apps, change dock items, or toggle settings:

```yaml
# Add/remove Homebrew casks
homebrew_casks:
  - obsidian
  - visual-studio-code

# Add/remove App Store apps (find IDs with: mas search <app>)
mas_apps:
  - { id: 937984704, name: "Amphetamine" }

# Change dock pins
dock_items:
  - name: Obsidian
    path: /Applications/Obsidian.app
```

## Dry run

To see what the playbook would change without applying anything:

```bash
make check
```
