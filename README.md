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
- **Bloom licence** – Enter the licence key (stored in 1Password) in Bloom's settings. The key is
  deliberately not in this repo.
- **Bloom as default file manager** – Cannot be scripted:
  `LSSetDefaultRoleHandlerForContentType("public.folder", ...)` returns -50, so `duti` and the
  API both fail. Do it through Finder instead: select any folder, Cmd-I, *Open with* -> Bloom,
  then *Change All*. Bloom's *Click Finder icon to open Bloom* option only works once that is
  set. Also enable *Intercept Command-Click Events from Dock* (`BloomHijackDockEvent`), which
  needs Accessibility permission granted to Bloom. Bloom's global hotkey is Cmd-Shift-Return.
- **Raycast** – Set the hotkey (it does not claim ⌘Space automatically) and sign in to sync
  settings. Raycast config is not managed by this playbook.
- **Safari extensions** – Installing them is automated, but enabling is not. Turn on 1Password,
  Wipr and Obsidian Web Clipper in *Safari → Settings → Extensions*. Safari records an
  `EnabledByUserGesture` flag per extension, so a scripted flip is unlikely to be honoured.
- **Web Clipper templates** – Import the three templates in
  `roles/settings/files/clipper-templates/` via the clipper's settings, then drag *Article* to the
  top so it acts as the fallback (the first template in the list wins when no trigger matches).
  Set *Vault* on each to `mycelium` – it defaults to "Last used". Clipper settings live in a
  SQLite store inside Safari's container, so none of this can be deployed by Ansible.
- **macOS AutoFill** – In 1Password (8.12.32+), *Settings → Autofill → Set up macOS AutoFill* →
  Turn On, until it shows "Active". If the setup card is missing right after an app update, lock
  and unlock 1Password to refresh it. Then in *System Settings → General → AutoFill & Passwords →
  "AutoFill from"*, keep **1Password** on and **Passwords** off. The provider rows aren't
  scriptable, so both steps are manual.
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
- Bloom (file manager)

**App Store:**
- Amphetamine
- 1Password for Safari (Safari extension)
- Wipr (Safari content blocker)
- Colorful Folder (folder icon customiser)
- Obsidian Web Clipper (Safari extension)

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
- **AutoFill** – Keeps the system-wide AutoFill switch on for 1Password's native macOS AutoFill; provider selection is a manual step (below)
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
