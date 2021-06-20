// eslint-disable-next-line eslint-comments/disable-enable-pair
import { DangerDSLType } from '../node_modules/danger/distribution/dsl/DangerDSL';

// eslint-disable-next-line no-var
declare var danger: DangerDSLType;

export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;

const conventionalCommitConfigs: Record<string, { name: string; emoji: string }> = {
  build: {
    name: 'Build',
    emoji: 'construction_worker',
  },
  chore: {
    name: 'Maintenance',
    emoji: 'construction_worker',
  },
  ci: {
    name: 'CI',
    emoji: 'runner',
  },
  docs: {
    name: 'Documentation',
    emoji: 'books',
  },
  feat: {
    name: 'Features',
    emoji: 'zap',
  },
  fix: {
    name: 'Fixes',
    emoji: 'wrench',
  },
  perf: {
    name: 'Performance',
    emoji: 'bar_chart',
  },
  refactor: {
    name: 'Refactor',
    emoji: 'mountain',
  },
  revert: {
    name: 'Revert',
    emoji: 'leftwards_arrow_with_hook',
  },
  style: {
    name: 'Style',
    emoji: 'nail_care',
  },
  test: {
    name: 'Test',
    emoji: 'traffic_light',
  },
};

function getConventionalCommitType(conventionalCommitTypes: string[], text: string): string | null {
  let changeType: string | null = null;
  conventionalCommitTypes.some(conventionalCommitType => {
    if (text.startsWith(conventionalCommitType)) {
      changeType = conventionalCommitType;
      return true;
    }
  });
  return changeType;
}

function renderCommitGroupMarkdown(group: string, messages: string[]) {
  const conventionalCommitConfig = conventionalCommitConfigs[group];
  if (conventionalCommitConfig) {
    return `
### :${conventionalCommitConfig.emoji}: ${conventionalCommitConfig.name}

- ${messages.map(message => `\`${message}\``).join('\n- ')}

    `.trim();
  } else {
    return `
### :question: Uncategorized

I was unable to render the category of these changes.
Consider using a scope for more grained results.

- ${messages.map(message => `\`${message}\``).join('\n- ')}
    `.trim();
  }
}

/**
 * yo danger-plugin
 */
export default function kirinus({
  conventionalCommitTypes = Object.keys(conventionalCommitConfigs),
  minBodyLength = 10,
  bigCommitsCount = 10,
  bigPRLinesCount = 2000,
  bigModifiedFilesCount = 100,
} = {}): void {
  const { commits, pr } = danger.github;

  // FAIL if there is not a proper description
  if (pr.body.length < minBodyLength) {
    fail('PR needs a proper description. Add a few sentences about what you want to change.');
  }

  // FAIL if title does not start with a conventional commit type
  const prChangeType = getConventionalCommitType(conventionalCommitTypes, pr.title);
  if (prChangeType == null) {
    fail(
      'PR title does not have a proper conventional type. ' +
        `It should be one of ${conventionalCommitTypes.join(', ')}. ` +
        'See [Conventional Commits](https://conventionalcommits.org).'
    );
  }

  // FAIL if title is longer than 72 characters
  if (pr.title.length > 72) {
    fail(
      'PR title is longer than 72 characters. It should adapt to the ' +
        '[Commit Message Guidelines](https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53) ' +
        'and [Conventional Commits](https://conventionalcommits.org).'
    );
  }

  // FAIL if title is not compliant with the basic conventional commits format
  if (!/^.+(\([a-z-]*\))?: [a-z].+/.test(pr.title)) {
    fail(
      'PR title is not compliant with the [Conventional Commits Standard](https://conventionalcommits.org). ' +
        'The expected format is `<type>(<scope>): <description>`.\n' +
        '- The scope should be in lowercase and can only be separated with dashes (`-`). Can be skipped if the change is global. \n' +
        `- The type should be one of ${conventionalCommitTypes.join(', ')}.\n` +
        '- The summary should follow the [Commit Message Guidelines](https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53)'
    );
  }

  // WARN if title does not have a scope
  const prScopeMatch = /\(([^)]+)\)/.exec(pr.title);
  const prScope = prScopeMatch ? prScopeMatch[1] : undefined;
  if (!prScope) {
    warn(
      'This PR does not have a scope. This might be ok, if the change is global and you do not want' +
        ' to have it in the Changelog. But it is not the normal case. ' +
        'Are you sure a scope is not needed? Consider adding a scope to the PR title with the ' +
        '`<type>(<scope>): <description>` format to avoid this issue. ' +
        'See [Conventional Commits](https://conventionalcommits.org).'
    );
  }

  // WARN if there is not a reference to a JIRA issue
  const JIRA_REGEX = /([A-Z]{3}-[0-9]{4})/;
  if (!JIRA_REGEX.test(pr.title)) {
    warn(
      'Is this PR related to a JIRA issue?\n' +
        'If so, link it at the end of the PR title, e.g. `feat(my-app): my description [MHP-XXXX]`. ' +
        'Therefore, the PR will be referenced in JIRA so everybody can see it.'
    );
  }

  // WARN if there is a big number of commits
  if (commits.length > bigCommitsCount) {
    warn(
      ':exclamation: This PR could be big!' +
        ' There are a lot of commits, which is a sign that changes can get out of hand.'
    );
  }

  // WARN if there is a big PR
  if (pr.additions + pr.deletions > bigPRLinesCount) {
    warn(':exclamation: This PR is huge! You should split it in smaller PRs.');
  }

  // WARN if modified files is a big list, MESSAGE otherwise
  const modifiedFiles = danger.git.modified_files;
  if (modifiedFiles.length > bigModifiedFilesCount) {
    warn(
      'There are a lot of modified files, unless you are updating packages under yarn2,' +
        'consider splitting this in smaller PRs.'
    );
  }

  // MESSAGE if screenshots were added
  if (pr.body.includes('.png') || pr.body.includes('.jpg') || pr.body.includes('.gif')) {
    message('You have added screenshots, you are an AMAZING human being :star:!');
  }

  // Group commits by change type
  const changesByType: Record<string, string[]> = {};
  commits.forEach(({ commit: { message } }) => {
    const commitType = getConventionalCommitType(conventionalCommitTypes, message);
    if (commitType !== null && message.includes(':')) {
      const description = message.split(':')[1].trim();
      changesByType[commitType]
        ? changesByType[commitType].push(description)
        : (changesByType[commitType] = [description]);
    } else {
      changesByType['uncategorized']
        ? changesByType['uncategorized'].push(message)
        : (changesByType['uncategorized'] = [message]);
    }
  });

  // MARKDOWN changes and files
  markdown(`
## Changes

${Object.entries(changesByType)
  .map(([changeType, messages]) => renderCommitGroupMarkdown(changeType, messages))
  .join('\n\n')}

## Files
${
  modifiedFiles.length > bigModifiedFilesCount
    ? `\n:warning: Showing only first ${bigModifiedFilesCount} out of ${modifiedFiles.length}\n`
    : ''
}
- ${modifiedFiles
    .slice(0, bigModifiedFilesCount + 1)
    .map(modifiedFile => `\`${modifiedFile}\``)
    .join('\n- ')}
  `);
}
