const loginWith = async (page, username, password) => {
  await page.getByTestId("username").fill(username)
  await page.getByTestId("password").fill(password)
  await page.getByRole("button", { name: "login" }).click()
  await page.getByText("logged in").waitFor()
}

const createBlog = async (page, title, author, url) => {
  await page.getByRole("button", { name: "new blog" }).click()
  await page.getByLabel("Title").fill(title)
  await page.getByLabel("Author").fill(author)
  await page.getByLabel("Url").fill(url)
  await page.getByRole("button", { name: "create" }).click()
  await page
    .locator("#notification")
    .filter({ hasText: "a new blog " + title })
    .waitFor()
}

export { loginWith, createBlog }
