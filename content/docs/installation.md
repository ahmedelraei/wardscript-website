# Installation

## Install script

On macOS or Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/ahmedelraei/wardscript/main/install/install.sh | sh
```

On Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/ahmedelraei/wardscript/main/install/install.ps1 | iex
```

The installer downloads the newest release for your platform, verifies its
SHA-256 checksum, puts `ward` in `~/.ward/bin` (`%USERPROFILE%\.ward\bin` on
Windows) and adds that folder to your `PATH`.

Supported platforms: Linux (x86_64, arm64), macOS (Apple Silicon, Intel) and
Windows (x86_64).

### Options

| Variable | Effect |
|---|---|
| `WARD_VERSION=v0.1.0-beta.1` | install a specific release |
| `WARD_INSTALL_DIR=...` | install somewhere else |
| `WARD_NO_MODIFY_PATH=1` | don't touch your `PATH` |

Check it worked:

```bash
ward --help
```

## Manual download

Download an archive from the
[releases page](https://github.com/ahmedelraei/wardscript/releases), check it
and put `ward` somewhere on your `PATH`. To verify it:

```bash
sha256sum -c --ignore-missing SHA256SUMS      # Linux
shasum -a 256 -c ward-<version>-<target>.tar.gz.sha256   # macOS
gh attestation verify ward-<version>-<target>.tar.gz --repo ahmedelraei/wardscript
```

The attestation proves the archive was built by the Wardscript release workflow.

## Using real models

`ward run` and `ward test` work out of the box with mock or recorded answers. To
talk to a real model, install the provider's SDK and set its API key:

```bash
pip install anthropic          # or: pip install openai
export ANTHROPIC_API_KEY=...   # or: OPENAI_API_KEY
```

## Using the output in your app

`ward run` and `ward test` ship their own copy of the Python runtime. To import
compiled programs into your own application you need the runtime package:

- **Python:** the `wardscript` package (Python 3.10+). See [Python](guides/python.md).
- **TypeScript:** the `wardscript` npm package (Node 22+). See [TypeScript](guides/typescript.md).

## Editor support

`ward lsp` is a language server with diagnostics, hover, go to definition and
formatting. A VS Code extension using it is available in the
[Wardscript repository](https://github.com/ahmedelraei/wardscript/tree/main/editors/vscode).

## Uninstall

Delete `~/.ward` and remove the `PATH` line the installer added to your shell
profile (it's marked "Added by the Wardscript installer").
