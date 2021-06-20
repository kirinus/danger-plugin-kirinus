# danger-plugin-kirinus

Set of Danger rules used to check Kirinus Digital PRs.

## Usage

Install:

```sh
yarn add danger-plugin-kirinus --dev
```

At a glance:

```js
// dangerfile.js
import kirinus from 'danger-plugin-kirinus';

kirinus();
```

To override the default parameters:

```js
// dangerfile.js
import kirinus from 'danger-plugin-kirinus';

kirinus({
  conventionalCommitTypes: ['feat', 'fix', 'chore'],
  minBodyLength: 30,
  bigCommitsCount: 20,
  bigPRLinesCount: 1000,
  bigModifiedFilesCount: 50,
});
```

| Name                    | Default                                                                                          | Description                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| conventionalCommitTypes | `['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']` | The conventional commit types to accept in the title check            |
| minBodyLength           | `10`                                                                                             | The minimum number of characters in the PR body to avoid bot warnings |
| bigCommitsCount         | `10`                                                                                             | The number of commits threshold to trigger a warning                  |
| bigPRLinesCount         | `2000`                                                                                           | The number of added and deleted lines threshold to trigger a warning  |
| bigModifiedFilesCount   | `100`                                                                                            | The number of modified files threshold to trigger a warning           |

## Changelog

See the GitHub [release history](https://github.com/darioblanco/danger-plugin-kirinus/releases).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
