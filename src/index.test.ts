// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import kirinus from './index';

declare const global: any;

describe('kirinus()', () => {
  const danger = {
    git: {
      modified_files: ['file1.md', 'file2.js'],
    },
    github: {
      commits: [
        { commit: { message: 'feat: commit 1' } },
        { commit: { message: 'fix(my-app1): commit 2' } },
        { commit: { message: 'chore(): commit 3' } },
        { commit: { message: 'docs(my-app2): commit 4' } },
        { commit: { message: 'fix(my-app): commit 4' } },
      ],
      pr: {
        additions: 200,
        deletions: 100,
        body: 'My PR body that is longer than 10 characters. ![image](myimage.png)',
        title: 'feat(my-app): my description [MHP-1234]',
      },
    },
  };

  beforeEach(() => {
    global.warn = jest.fn();
    global.message = jest.fn();
    global.fail = jest.fn();
    global.markdown = jest.fn();
  });

  afterEach(() => {
    global.warn = undefined;
    global.message = undefined;
    global.fail = undefined;
    global.markdown = undefined;
  });

  it('Messages if everything is fine', () => {
    global.danger = danger;

    kirinus();

    expect(global.message).toHaveBeenCalledWith(
      expect.stringMatching(/^You have added screenshots/)
    );
    expect(global.markdown.mock.calls[0]).toMatchSnapshot();
    expect(global.warn).not.toBeCalled();
    expect(global.fail).not.toBeCalled();
  });

  it('Fails if there is no proper description', () => {
    global.danger = {
      ...danger,
      github: {
        ...danger.github,
        pr: {
          ...danger.github.pr,
          body: 'Short',
        },
      },
    };

    kirinus();

    expect(global.warn).not.toBeCalled();
    expect(global.fail).toHaveBeenCalledWith(
      expect.stringMatching(/^PR needs a proper description./)
    );
    expect(global.markdown).toBeCalled();
  });

  it('Fails if title does not start with a conventional commit type', () => {
    global.danger = {
      ...danger,
      github: {
        ...danger.github,
        pr: {
          ...danger.github.pr,
          title: 'non-conventional(my-app): my description [MHP-1234]',
        },
      },
    };

    kirinus();

    expect(global.warn).not.toBeCalled();
    expect(global.fail).toHaveBeenCalledWith(
      expect.stringMatching(/^PR title does not have a proper conventional type./)
    );
    expect(global.markdown).toBeCalled();
  });

  it('Warns if title does not have a scope', () => {
    global.danger = {
      ...danger,
      github: {
        ...danger.github,
        pr: {
          ...danger.github.pr,
          title: 'feat: my description [MHP-1234]',
        },
      },
    };

    kirinus();

    expect(global.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^This PR does not have a scope./)
    );
    expect(global.fail).not.toBeCalled();
    expect(global.markdown).toBeCalled();
  });

  it('Warns if there is no reference to a JIRA issue', () => {
    global.danger = {
      ...danger,
      github: {
        ...danger.github,
        pr: {
          ...danger.github.pr,
          title: 'feat: my description',
        },
      },
    };

    kirinus();

    expect(global.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^Is this PR related to a JIRA issue?/)
    );
    expect(global.fail).not.toBeCalled();
    expect(global.markdown).toBeCalled();
  });

  it('Warns if there is a big number of commits', () => {
    global.danger = danger;

    kirinus({ bigCommitsCount: 3 });

    expect(global.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^:exclamation: This PR could be big!/)
    );
    expect(global.fail).not.toBeCalled();
    expect(global.markdown).toBeCalled();
  });

  it('Warns if there is a big number of line changes', () => {
    global.danger = danger;

    kirinus({ bigPRLinesCount: 100 });

    expect(global.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^:exclamation: This PR is huge!/)
    );
    expect(global.fail).not.toBeCalled();
    expect(global.markdown).toBeCalled();
  });

  it('Warns if there are a lot of modified files', () => {
    global.danger = danger;

    kirinus({ bigModifiedFilesCount: 1 });

    expect(global.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^There are a lot of modified files/)
    );
    expect(global.fail).not.toBeCalled();
    expect(global.markdown).toBeCalled();
  });
});
