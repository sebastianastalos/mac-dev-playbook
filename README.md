# mac-dev-playbook

![Lint](https://github.com/sebastianastalos/mac-dev-playbook/actions/workflows/lint.yml/badge.svg)

Ansible playbook to automate setting up a fresh Mac for development.

## Installation

1. Install Homebrew:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Ansible:
   ```bash
   brew install ansible
   ```

3. Clone this repository:
   ```bash
   git clone https://github.com/sebastianastalos/mac-dev-playbook.git
   cd mac-dev-playbook
   ```

4. Install required Ansible collections (defined in `requirements.yml`):
   ```bash
   make setup
   ```

5. Run the playbook:
   ```bash
   make run
   ```

> **Note:** You will be prompted for your macOS password when the playbook runs (`BECOME` password).

## Manual steps required

**Before running:**
- **Mac App Store** – Sign in first. Amphetamine is installed via the App Store.
- **Quit Safari** – Safari rewrites its own prefs on exit, so the Safari tasks only stick if it's closed.

**After running:**
- **GitHub CLI** – Run `gh auth login` to authenticate, then `make run` again so the credential helper wires up.
- **SSH key** – The playbook generates `~/.ssh/id_ed25519`. Copy it to any VMs with `ssh-copy-id user@host`.
- **Sign into apps** – 1Password, Obsidian, Claude.
- **Raycast** – Set the hotkey (it does not claim ⌘Space automatically) and sign in to sync
  settings. Raycast config is not managed by this playbook.
- **Safari extensions** – Installing them is automated, but enabling is not. Turn on 1Password
  and Wipr in *Safari → Settings → Extensions*. Safari records an `EnabledByUserGesture` flag
  per extension, so a scripted flip is unlikely to be honoured.
- **1Password SSH agent** – Turn on *Settings → Developer → Use the SSH Agent*. This can't be
  automated: `sshAgent.enabled` in 1Password's `settings.json` is protected by an HMAC in the
  same file's `authTags`, so an out-of-band edit is detectable. The playbook wires `ssh` up to
  the agent socket, but the toggle itself is one manual click.

## What gets installed

**Apps (Homebrew):**
- Obsidian
- 1Password
- Claude Desktop
- Visual Studio Code
- Docker
- Tailscale
- cmux
- Itsycal (menu bar calendar)
- Raycast (launcher)

**App Store:**
- Amphetamine
- 1Password for Safari (Safari extension)
- Wipr (Safari content blocker)
- Colorful Folder (folder icon customiser)

**Other CLI tools:**
- claude-chats (browse/delete Claude Code chat history, pinned release binary)

**CLI tools (Homebrew):**
- GitHub CLI (`gh`)
- dockutil
- Terraform
- Packer
- 1Password CLI (`op`)
- ansible-lint
- yamllint

**npm:**
- Claude Code (`@anthropic-ai/claude-code`)

## What gets configured

- **macOS** – Hidden files, Finder improvements (column view, extensions, status bar), keyboard repeat, screenshots saved to `~/Screenshots`
- **Safari** – Turns off auto-correct, and turns off contacts autofill so the iCloud "Hide My Email" suggestion stops appearing in email fields
- **Apple Passwords** – Turns off autofill system-wide, so only 1Password offers logins
- **Git** – User identity, default branch (`main`), `pull.rebase`, global `.gitignore`
- **Dock** – Pins apps in order: Obsidian, VS Code, Claude, 1Password, cmux
- **SSH** – Generates an `ed25519` keypair if one doesn't exist, and points `ssh` at the 1Password SSH agent via `IdentityAgent` in `~/.ssh/config` plus `SSH_AUTH_SOCK` in `~/.zshrc`
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
