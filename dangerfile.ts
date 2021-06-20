import { rules as conventionalRules } from '@commitlint/config-conventional';
import commitlint from 'danger-plugin-conventional-commitlint';
import kirinus from 'danger-plugin-kirinus';

kirinus();

(async function dangerReport() {
  // FAIL if commits are not following the conventional rules
  await commitlint(conventionalRules, { severity: 'fail' });
})();
