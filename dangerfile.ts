import { rules as conventionalRules } from '@commitlint/config-conventional';
import { danger, fail, message, warn } from 'danger';
import commitlint from 'danger-plugin-conventional-commitlint';

const {
  api: githubApi,
  thisPR: { owner, repo },
  commits,
  pr,
} = danger.github;

// FAIL if there is not a proper description
if (pr.body.length < 10) {
  fail('PR needs a proper description. Add a few sentences about what you want to change.');
}

// FAIL if title is not compliant with conventional commits
const TITLE_REGEX =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z-]*\))?: [a-z][a-zA-Z0-9 ]+([[A-Z]+-[0-9]{4}])?/;
if (!TITLE_REGEX.test(pr.title)) {
  fail(
    'PR title is not compliant with the [Conventional Commits Standard](https://conventionalcommits.org). ' +
      'The expected format is `<type>(<scope>): <description>`.\n' +
      '- The scope should be in lowercase and can only be separated with dashes (`-`). Can be skipped if the change is global. \n' +
      '- The type can be one of `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.\n' +
      '- The description (and optional body and footer) should follow the [Commit Message Guidelines](https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53)'
  );
}

// WARN if title does not have a scope
const TITLE_SCOPE_REGEX = /.+(\([a-z-]*\)):.*/;
if (!TITLE_SCOPE_REGEX.test(pr.title)) {
  warn(
    'This PR does not have a scope. This might be ok, if the change is global and you do not want' +
      ' to have it in the Changelog. But it is not the normal case. Are you sure a scope is not needed? ' +
      'Consider adding a scope to the PR title with the `<type>(<scope>): <description>` format to avoid this issue.'
  );
}

// WARN if there is not a reference to a JIRA issue
const JIRA_REGEX = /([A-Z]{3}-[0-9]{4})/;
if (!JIRA_REGEX.test(pr.title)) {
  warn(
    'Is this PR related to a JIRA issue?\n' +
      'If so, link it at the end of the PR title, e.g. `feat(my-app): my description [MHP-XXX]`. ' +
      'Therefore, the PR will be referenced in JIRA so everybody can see it.'
  );
}

// MESSAGE if screenshots were added
if (pr.body.includes('.png') || pr.body.includes('.jpg') || pr.body.includes('.gif')) {
  message('You have added screenshots, you are an AMAZING human being :star:!');
}

// MESSAGE list of commits
message(
  `Commits in this PR:\n- ${commits.map(({ commit }) => `\`${commit.message}\``).join('\n- ')}`
);

// WARN if there is a big number of commits
const bigCommitsThreshold = 10;
if (commits.length > bigCommitsThreshold) {
  warn(
    ':exclamation: This PR could be big!' +
      ' There are a lot of commits, which is a sign that changes can get out of hand.'
  );
}

// WARN if there is a big PR
const bigPRThreshold = 2000;
if (pr.additions + pr.deletions > bigPRThreshold) {
  warn(':exclamation: This PR is huge! You should split it in smaller PRs.');
}

// WARN if modified files is a big list, MESSAGE otherwise
const modifiedFiles = danger.git.modified_files;
if (modifiedFiles.length > 50) {
  warn(
    'There are a lot of modified files, unless you are updating packages under yarn2,' +
      'consider splitting this in smaller PRs.'
  );
} else {
  message(
    `Changed Files in this PR:\n- ${modifiedFiles
      .map(modifiedFile => `\`${modifiedFile}\``)
      .join('\n- ')}`
  );
}

(async function dangerReport() {
  // FAIL if commits are not following the conventional rules
  await commitlint(conventionalRules, { severity: 'fail' });
  // FAIL if a check run from the last commit failed
  const lastCommit = commits.pop();
  const { data } = await githubApi.checks.listForRef({ owner, repo, ref: lastCommit.sha });
  data.check_runs.forEach(({ conclusion, status, name, html_url }) => {
    if (status === 'completed' && conclusion != 'success') {
      fail(`Check [${name}](${html_url}) is not successful. It needs to be fixed before merge.`);
    } else if (status !== 'completed') {
      warn(`Check [${name}](${html_url}) was not completed. Only merge if it is green.`);
    }
  });
})();
