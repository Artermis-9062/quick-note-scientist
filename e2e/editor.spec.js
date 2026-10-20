import { test, expect } from '@playwright/test';

test.describe('Keyboard-First Editor - Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('text=Notes for Scientist');
    // Click Create New Note
    await page.click('text=Create +');
    // Wait for editor to appear
    await page.waitForSelector('textarea.markdown-input');
  });

  test.describe('Bug A: Caret Jump on Translation', () => {
    test('caret stays at correct position after keyword translation', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block with double-tab
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Verify math block created
      await expect(textarea).toHaveValue(/\\start \\end/);

      // Type a Greek letter keyword and press space to trigger translation
      await textarea.type('alpha ');

      // The value should contain the translated symbol
      await expect(textarea).toHaveValue(/α/);

      // Get caret position - it should be after the translated symbol, not at 0
      const caretPosition = await textarea.evaluate(el => el.selectionStart);
      expect(caretPosition).toBeGreaterThan(0);
      expect(caretPosition).not.toBe(0);
    });

    test('caret stays at correct position after multiple keyword translations', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Type multiple keywords with spaces
      await textarea.type('alpha beta gamma ');

      // All should be translated
      await expect(textarea).toHaveValue(/α/);
      await expect(textarea).toHaveValue(/β/);
      await expect(textarea).toHaveValue(/γ/);

      // Caret should be at the end, not at position 0
      const caretPosition = await textarea.evaluate(el => el.selectionStart);
      expect(caretPosition).toBeGreaterThan(10);
    });

    test('caret position preserved during rapid typing', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Rapidly type multiple keywords
      await textarea.type('alpha beta gamma delta epsilon ');

      // Verify translations occurred
      await expect(textarea).toHaveValue(/α/);
      await expect(textarea).toHaveValue(/β/);
      await expect(textarea).toHaveValue(/γ/);
      await expect(textarea).toHaveValue(/δ/);
      await expect(textarea).toHaveValue(/ε/);

      // Caret should be at the end (not at position 0)
      const caretPosition = await textarea.evaluate(el => el.selectionStart);
      expect(caretPosition).toBeGreaterThan(0);
      expect(caretPosition).not.toBe(0);
    });
  });

  test.describe('Bug B: Ctrl+Delete / Ctrl+Backspace Native Behavior', () => {
    test('Ctrl+Delete deletes next word outside math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Type some text outside math block
      await textarea.type('hello world test');

      // Position caret before "world"
      await textarea.press('Home');
      await textarea.press('Control+ArrowRight'); // Move to start of "world"

      // Press Ctrl+Delete to delete "world"
      await textarea.press('Control+Delete');

      // "world" should be deleted
      await expect(textarea).toHaveValue('hello test');
    });

    test('Ctrl+Backspace deletes previous word outside math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Type some text
      await textarea.type('hello world test');

      // Position caret after "world"
      await textarea.press('End');
      await textarea.press('Control+ArrowLeft'); // Move to start of "test"

      // Press Ctrl+Backspace to delete "world"
      await textarea.press('Control+Backspace');

      // "world " should be deleted
      await expect(textarea).toHaveValue('hello test');
    });

    test('Ctrl+Delete still works for math block selection inside math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Type inside math block
      await textarea.type('alpha beta');

      // Press Ctrl+Delete - should select the math block (first press)
      await textarea.press('Control+Delete');

      // The math block should be selected
      const selection = await textarea.evaluate(el => ({
        start: el.selectionStart,
        end: el.selectionEnd,
        value: el.value
      }));

      // Should have selected the entire math block
      expect(selection.start).toBeLessThan(selection.end);
      expect(selection.value).toContain('\\start');
      expect(selection.value).toContain('\\end');

      // Press Ctrl+Delete again - should delete the math block
      await textarea.press('Control+Delete');

      // Math block should be deleted, leaving empty editor
      await expect(textarea).toHaveValue('');
    });

    test('Backspace works normally inside math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Type inside math block without triggering translation (no space)
      await textarea.type('alpha');

      // Regular Backspace should work (delete one char)
      await textarea.press('Backspace');

      // Character should be deleted, caret should not jump to 0
      const caretPosition = await textarea.evaluate(el => el.selectionStart);
      expect(caretPosition).not.toBe(0);
      // Value should be shorter
      const value = await textarea.inputValue();
      expect(value.length).toBeLessThan('\\start alpha\\end'.length);
    });
  });

  test.describe('Integration: Combined workflows', () => {
    test('can type keywords, navigate, and use native shortcuts', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Type keywords
      await textarea.type('alpha beta ');

      // Use Ctrl+ArrowLeft to navigate words
      await textarea.press('Control+ArrowLeft');
      await textarea.press('Control+ArrowLeft');

      // Type more
      await textarea.type('gamma ');

      // Verify all translations
      await expect(textarea).toHaveValue(/α/);
      await expect(textarea).toHaveValue(/β/);
      await expect(textarea).toHaveValue(/γ/);

      // Caret should not be at 0
      const caretPosition = await textarea.evaluate(el => el.selectionStart);
      expect(caretPosition).not.toBe(0);
    });

    test('math mode indicator appears when in math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Initially no math mode indicator in editor header
      await expect(page.locator('.math-editor-header .math-mode-badge')).not.toBeVisible();

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Math mode indicator should appear in editor header
      await expect(page.locator('.math-editor-header .math-mode-badge')).toBeVisible();
      await expect(page.locator('.math-editor-header .math-indicator')).toHaveText('∑');
    });

    test('math mode indicator disappears when exiting math block', async ({ page }) => {
      const textarea = page.locator('textarea.markdown-input');

      // Create math block
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Verify math mode is active in editor header
      await expect(page.locator('.math-editor-header .math-mode-badge')).toBeVisible();

      // Exit math block with double-tab
      await textarea.press('Tab');
      await page.waitForTimeout(100);
      await textarea.press('Tab');

      // Math mode indicator should disappear from editor header
      await expect(page.locator('.math-editor-header .math-mode-badge')).not.toBeVisible();
    });
  });
});