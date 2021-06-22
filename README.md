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
  branchSize: {
    severity: 'fail',
  },
  conventional: {
    severity: 'disabled',
  },
  prLint: {
    severity: 'disabled',
  },
  jira: {
    severity: 'message',
  },
});
```

| Config       | Name          | Default                                 | Description                                    |
| ------------ | ------------- | --------------------------------------- | ---------------------------------------------- |
| branchSize   | maxCommits    | `10`                                    | maximum number of commits                      |
| branchSize   | maxLines      | `2000`                                  | maximum number of line additions and deletions |
| branchSize   | maxFiles      | `100`                                   | maximum number of changed files                |
| branchSize   | severity      | `warn`                                  | danger event type                              |
| conventional | rules         | `@commitlint/config-conventional` rules | conventional commit rules to lint              |
| conventional | severity      | `fail`                                  | danger event type                              |
| prLint       | minBodyLength | `warn`                                  | dminimum number of characters in the PR body   |
| prLint       | severity      | `fail`                                  | danger event type                              |
| jira         | severity      | `warn`                                  | danger event type                              |

## Changelog

See the GitHub [release history](https://github.com/darioblanco/danger-plugin-kirinus/releases).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
