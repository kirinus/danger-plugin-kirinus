import lint from '@commitlint/lint';
import { rules as conventionalCommitRules } from '@commitlint/config-conventional';
import { QualifiedRules } from '@commitlint/types';

// eslint-disable-next-line eslint-comments/disable-enable-pair
import { DangerDSLType } from '../node_modules/danger/distribution/dsl/DangerDSL';
import {
  BranchSizeConfig,
  Config,
  ConventionalConfig,
  JIRAConfig,
  PRLintConfig,
  Severity,
} from './types';

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
const conventionalCommitTypes = Object.keys(conventionalCommitConfigs);

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

function dangerEvent(msg: string, severity: Severity, skipFail = false) {
  switch (severity) {
    case Severity.Fail:
      if (skipFail) {
        warn(msg);
      } else {
        fail(msg);
      }
      break;
    case Severity.Warn:
      warn(msg);
      break;
    case Severity.Message:
      message(msg);
      break;
    case Severity.Disable:
      break;
  }
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

function lintPR({
  minBodyLength = 10,
  severity = Severity.Fail,
  scoped = true,
}: PRLintConfig = {}) {
  const { pr } = danger.github;
  if (pr.body.length < minBodyLength) {
    dangerEvent(
      'PR needs a proper description. Add a few sentences about what you want to change.',
      severity
    );
  }

  const maxTitleLength = 72;
  if (pr.title.length > maxTitleLength) {
    dangerEvent(
      `PR title is longer than ${maxTitleLength} characters. It should adapt to the ` +
        '[Commit Message Guidelines](https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53) ' +
        'and [Conventional Commits](https://conventionalcommits.org).',
      severity
    );
  }

  const prScopeMatch = /\(([^)]+)\)/.exec(pr.title);
  const prScope = prScopeMatch ? prScopeMatch[1] : undefined;
  if (scoped && !prScope) {
    dangerEvent(
      'This PR does not have a scope. This might be ok, if the change is global and you do not want' +
        ' to have it in the Changelog. But it is not the normal case. ' +
        'Are you sure a scope is not needed? Consider adding a scope to the PR title with the ' +
        '`<type>(<scope>): <description>` format to avoid this issue. ' +
        'See [Conventional Commits](https://conventionalcommits.org).',
      severity,
      true
    );
  }
}

function checkJIRA({ severity = Severity.Warn }: JIRAConfig = {}) {
  const { pr } = danger.github;
  const JIRA_REGEX = /([A-Z]{3}-[0-9]{4})/;
  if (!JIRA_REGEX.test(pr.title)) {
    dangerEvent(
      'Is this PR related to a JIRA issue?\n' +
        'If so, link it at the end of the PR title, e.g. `feat(my-app): my description [MHP-XXXX]`. ' +
        'Therefore, the PR will be referenced in JIRA so everybody can see it.',
      severity
    );
  }
}

function checkBranchSize({
  maxCommits = 10,
  maxLines = 2000,
  maxFiles = 100,
  severity = Severity.Warn,
}: BranchSizeConfig = {}) {
  const { modified_files: modifiedFiles } = danger.git;
  const { commits, pr } = danger.github;

  if (commits.length > maxCommits) {
    dangerEvent(
      ':exclamation: There are a lot of commits, which is a sign that changes can get out of hand.',
      severity
    );
  }

  if (pr.additions + pr.deletions > maxLines) {
    dangerEvent(
      `:exclamation: This PR has ${pr.additions} additions and ${pr.deletions} deletions. ` +
        'You should split it in smaller PRs.',
      severity
    );
  }

  if (modifiedFiles.length > maxFiles) {
    dangerEvent(
      ':exclamation: There are a lot of modified files, consider splitting this change in smaller PRs.',
      severity
    );
  }
}

async function checkConventional({
  rules = conventionalCommitRules as QualifiedRules,
  severity = Severity.Fail,
}: ConventionalConfig = {}) {
  const { commits, pr } = danger.github;

  const messages = commits.map(({ commit: { message } }) => message);
  messages.push(pr.title);
  for (const msg of messages) {
    const { valid: isCommitValid, errors } = await lint(msg, rules);
    if (!isCommitValid) {
      dangerEvent(
        `Message "${msg}" does not follow the [Conventional Commits](https://conventionalcommits.org) style.\n` +
          `- :exclamation: ${errors
            .map(({ message }) => `\`${message}\``)
            .join('\n- :exclamation: ')}`,
        severity
      );
    }
  }
}

function renderMarkdown({ fileLimit = 50 }: { fileLimit?: number }) {
  const { modified_files: modifiedFiles } = danger.git;
  const { commits } = danger.github;

  // Group commits by change type
  const changesByType: Record<string, string[]> = {};
  commits.forEach(({ commit: { message } }) => {
    const commitType = getConventionalCommitType(conventionalCommitTypes, message);
    if (commitType !== null && message.includes(':')) {
      const [, scope, msg] = /\w+(?:\((.+)?\))?:(.+)/.exec(message) as RegExpExecArray;
      const description = scope ? `${scope}: ${msg.trim()}` : msg.trim();
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
  .map(([changeType, messages]) =>
    renderCommitGroupMarkdown(changeType, Array.from(new Set(messages)))
  )
  .join('\n\n')}

## Files
${
  modifiedFiles.length > fileLimit
    ? `\n:warning: Showing only first ${fileLimit} out of ${modifiedFiles.length}\n`
    : ''
}
- ${modifiedFiles
    .slice(0, fileLimit + 1)
    .map(modifiedFile => `\`${modifiedFile}\``)
    .join('\n- ')}
  `);
}

/**
 * yo danger-plugin
 */
export default async function kirinus({
  branchSize,
  conventional,
  prLint,
  jira,
}: Config = {}): Promise<void> {
  renderMarkdown({ fileLimit: branchSize && branchSize.maxFiles });
  lintPR(prLint);
  checkBranchSize(branchSize);
  await checkConventional(conventional);
  checkJIRA(jira);
}
