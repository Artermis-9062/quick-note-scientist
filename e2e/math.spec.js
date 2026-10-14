import { test, expect } from '@playwright/test';

/** Start with the empty browser context supplied by Playwright, then open a fresh editor. */
async function openEditor(page) {
  // Dismiss the app's save alert so it cannot block a later reload or browser assertion.
  page.on('dialog', dialog => dialog.dismiss());
  await page.goto('/');
  await page.getByRole('link', { name: /Create/ }).click();
  return page.getByPlaceholder('Type your notes here...', { exact: false });
}

/** A rendered equation must contain KaTeX output without an error node. */
async function expectEquation(page) {
  const preview = page.locator('.preview-pane');
  await expect(preview.locator('.katex')).toHaveCount(1);
  await expect(preview.locator('.katex-error')).toHaveCount(0);
}

test('typing a command into a completed block preserves text and caret', async ({ page }) => {
  const editor = await openEditor(page);
  await editor.fill(String.raw`\start  \end`);
  // Insert at the inner start, reproducing onChange for each keystroke rather than one fill.
  await editor.evaluate(element => {
    element.focus();
    element.setSelectionRange(7, 7);
  });
  await page.keyboard.type(String.raw`\alpha`);
  await expect(editor).toHaveValue(String.raw`\start \alpha \end`);
  expect(await editor.evaluate(element => element.selectionStart)).toBe(13);
  await expectEquation(page);
});

test('a real clipboard paste preserves alpha and fraction commands', async ({ page }) => {
  const editor = await openEditor(page);
  const source = String.raw`\start \alpha + \frac{1}{2} \end`;
  // Chromium clipboard permissions are granted in config; exercise the browser's paste event.
  await page.evaluate(text => navigator.clipboard.writeText(text), source);
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect(editor).toHaveValue(source);
  await expectEquation(page);
});

test('later edits do not add backslashes to translated fractions', async ({ page }) => {
  const editor = await openEditor(page);
  await editor.fill(String.raw`\start frac{1}{2} \end`);
  await expect(editor).toHaveValue(String.raw`\start \frac{1}{2} \end`);
  // Editing prose still retranslates the entire textarea, which currently corrupts the fraction.
  await editor.press('End');
  await editor.pressSequentially(' tail');
  await expect(editor).toHaveValue(String.raw`\start \frac{1}{2} \end tail`);
  await expectEquation(page);
});

test('commands survive saving, reopening, and reloading', async ({ page }) => {
  const editor = await openEditor(page);
  const source = String.raw`\start \alpha + \beta \end`;
  await page.getByPlaceholder('Note title...').fill('Command regression');
  await editor.fill(source);
  await page.getByRole('button', { name: /Save Note/ }).click();
  // Reload uses the actual legacy storage on this independent mvp-feat-based branch.
  await page.reload();
  await page.getByRole('heading', { name: 'Command regression' }).click();
  await expect(page.getByPlaceholder('Type your notes here...', { exact: false })).toHaveValue(source);
  await expectEquation(page);
});

test('bare shortcuts and untouched prose still work', async ({ page }) => {
  const editor = await openEditor(page);
  await editor.fill(String.raw`the alpha particle
\start alpha + beta \end`);
  await expect(editor).toHaveValue(String.raw`the alpha particle
\start α + β \end`);
  await expectEquation(page);
});
