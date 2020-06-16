# node-bin-manager

Manage remote binary dependencies in package.json

Sometimes working with JS ecosystem requires dependencies written with different languages.

With the advent of golang and rust these dependencies are often distributed as single-binary
executables from github as a release artifacts.

This tool aims to provide cross-platform npm-like experience with managing these dependencies.

Similar to `npm` this util-package downloads archives from remote resources,
decompress them, and places them to conventional directories.

Best used with single-binary self-contained tools like
[k6](https://github.com/loadimpact/k6),
[consul](https://github.com/hashicorp/consul),
etc.


Features:

* Load archive from remote resources
* Decompress archive (`tar`, `tar.gz`, `tar.xz`, and `zip` are supported)
* Filter archive files
* Write archive files into a specified directory (with execution permission)


Content:

* [Installation](#installation)
* [Running](#running)
* [Configuration](#configuration)
* [CLI Usage](#cli-usage)
* [Caveats and Limitation](#caveats-and-limitations)
* [Contributing](CONTRIBUTING.md)


## Installation

Install package via npm (for example, globally):

```bash
$ npm install node-bin-manager --global
```

or yarn:

```bash
$ yarn global add node-bin-manager
```

## Running

### Add new binary dependency

To install new binary dependency run:

```bash
$ nbm install <url>
```

where `<url>` is URL pointing to publicly accessible archive with required
binaries.

> Note the OS platform for which binaries are compiled.
>
> By default, `node-bin-manager` assumes that provided URL points to binaries
> compiled for current user platform.

After the install command is complete downloaded binary will be placed to
`./node_modules/.bin` directory and `./package.json` will be updated with

```json
{
  "binDependencies": {
    "{bin}": { "{platform}": "{url}" }
  }
}
```

For example, we need to install k6, our current OS is linux. Then, command

```bash
$ nbm install https://github.com/loadimpact/k6/releases/download/v0.26.2/k6-v0.26.2-linux64.tar.gz
```

will result with file `./node_modules/.bin/k6` and `package.json` updated with:

```json
{
  "binDependencies": {
    "k6": {
      "linux": "https://github.com/loadimpact/k6/releases/download/v0.26.2/k6-v0.26.2-linux64.tar.gz"
    }
  }
}
```

Right now k6 binary can be used only by linux users. `node-bin-manager`
doesn't know how to load binaries for other platforms.

We may correct this manualy in our `package.json` or with commands:

```bash
$ nbm install -p darwin https://releases.hashicorp.com/consul/1.7.3/consul_1.7.3_darwin_amd64.zip
$ nbm install -p win32  https://releases.hashicorp.com/consul/1.7.3/consul_1.7.3_windows_amd64.zip
```

So resulting `binDependencies` section at `package.json` look like this:

```json
{
  "binDependencies": {
    "k6": {
      "darwin": "https://github.com/loadimpact/k6/releases/download/v0.26.2/k6-v0.26.2-mac.zip",
      "win32": "https://github.com/loadimpact/k6/releases/download/v0.26.2/k6-v0.26.2-win64.zip",
      "linux": "https://github.com/loadimpact/k6/releases/download/v0.26.2/k6-v0.26.2-linux64.tar.gz"
    }
  }
}
```

> When creating `binDependencies` configuration by hand, be sure
> the dependency key matches the name of the resulting executable
> (without extension). Otherwise, `node-bin-manager` will not be
> able to check whether binary exists on install.


### Restore all configured binary dependencies

To restore the dependencies specified in `package.json` use:

```bash
$ nbm install
```

This command will concurrently load all dependencies from `package.json`
matching our OS platform into `./node_modules/.bin` directory.

To install binaries on `npm install` configure `scripts` in `package.json` to include

```json
{
  "scripts": {
    "install": "nbm install"
  }
}
```

## Configuration

Dependency configuration is done via json-file (`package.json` by default).

The file must use the following format (in TypeScript syntax):

```ts
{
  // node-bin-manage config section
  binDependencies: {
    // unique dependecy name; should match executable name
    [dependencyKey: string]: {

      // directory to put archive contents into
      out?: string,

      // array of files in archive to ignore (glob patterns supported)
      exclude?: string[],

      // array of files in archive to save (glob patterns supported)
      include?: string[],

      // fallback dependecy URL for all platforms
      url?: string,

      // per platform URLs; key match NodeJS platform identifiers: linux, darwin, win32
      [platform: string]?: string,
    }
  }
}
```

> Note that NodeJS uses `win32` platform identifier both for x86 and x64 architectures.
>
> `node-bin-manager` does not take OS architecture into account, providing no support
> for using x86 and x64 URLs for the same platform. Basically, this means **no x86 support**.
>
> Feel free to submit a request for this feature in Issues.

> `exclude` patterns take precedence over `include` ones.
> For example, if we include `**/*.md` and exclude `**/README.md` then `README.md` will be ignored.
>
> Note that root directory in an archive is considered when matching patterns.

> See full config file example in [bin.config.json](./bin.config.json)

## CLI Usage

> Use `nbm --help` and `nbm <command> --help` for most up-to-date options

### `nbm install [url]`

Restores all dependencies from the configuration file.

When `[url]` argument specified, adds provided URL to config and restores only this dependency.

#### Options

| Short | Full                | Default             | Description                                                        |
|------:|---------------------|---------------------|--------------------------------------------------------------------|
| -q    | --quiet             | false               | Suppress all log messages                                          |
|       | --raw               | false               | Output logs without spinners and colors                            |
|       | --debug             | false               | Display additional error information                               |
| -f    | --force             | false               | Download binaries even if they already installed                   |
| -c    | --cwd <path>        | .                   | Path to working directory                                          |
|       | --config <path>     | package.json        | Path to configuration file                                         |
| -o    | --out <path>        | ./node_modules/.bin | Path to save all binaries                                          |
| -k    | --key <string>      |                     | Name of the dependecy to install (from config)                     |
| -p    | --platform <string> | current platform    | Identifier of the platform to select the binary for                |
| -s    | --seq               | false               | Install next binary only when previous completes (in config order) |

## Caveats and Limitations

### No x86 support

`node-bin-manager` does not take OS architecture into account, providing no support
for using x86 and x64 URLs for the same platform.

Basically, this means **no x86 support**.

Feel free to submit a request for this feature in Issues.

### Not every executable is supported

`node-bin-manager` designed to work with single-file programs
without extra dependencies.

It does not install OS packages (`.deb`, `.msi`, etc.).
Nor does it install additional dependencies (like Python, Java, etc.).

If the dependency archive contains multiple files, all of them will be extracted
to configured directory. But beware of multiple dependencies containing
files with the same name. `node-bin-manager` will not handle this situation
and overwrite files in arbitrary order.

To avoid this situation use different `out` directories or `exclude` some files.

### Detecting installed binaries

`node-bin-manager` uses the dependency key from the config to determine if it is already
installed. So if the dependency key does not refer to any file in an archive,
`node-bin-manager` will load this dependency on every install.

### Not every archive-type is supported

`node-bin-manager` supports only:

* `*.tar`
* `*.tar.gz`
* `*.tar.xz`
* `*.zip`

> no *.tar.bz and *.tar.bz2 support yet

Feel free to submit a request for additional archive types support in Issues.
