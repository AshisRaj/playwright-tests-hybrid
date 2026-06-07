import { expect, test } from '@fixtures';

test('login', { tag: ['@smoke', '@regression'] }, async ({ page, loginPage }) => {
  // then perform UI actions
  await loginPage.navigation.goToLoginPage();
  await loginPage.login(process.env.USER_NAME!, process.env.USER_PASSWORD!);
  await expect(page.getByText('Products')).toBeVisible();
});
