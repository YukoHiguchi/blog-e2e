const { test, expect, beforeEach, describe } = require("@playwright/test")
const { loginWith, createBlog } = require("./helper")

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("/api/testing/reset")
    await request.post("/api/users", {
      data: {
        name: "Matti Luukkainen",
        username: "mluukkai",
        password: "salainen",
      },
    })
    await page.goto("")
  })

  test("Login form is shown", async ({ page }) => {
    const locator = page.getByText("Log in to application")
    await expect(locator).toBeVisible()
    await expect(page.getByTestId("username")).toBeVisible()
    await expect(page.getByTestId("password")).toBeVisible()
  })

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await loginWith(page, "mluukkai", "salainen")
      await expect(page.getByText("Matti Luukkainen logged in")).toBeVisible()
    })

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByTestId("username").fill("wrong")
      await page.getByTestId("password").fill("wrong")
      await page.getByRole("button", { name: "login" }).click()
      const errorDiv = page.locator(".error")
      await expect(errorDiv).toContainText("wrong username or password")
    })
    describe("When logged in", () => {
      beforeEach(async ({ page }) => {
        await loginWith(page, "mluukkai", "salainen")
      })

      test("a new blog can be created", async ({ page }) => {
        await createBlog(page, "title one", "author one", "https://url.one")
        await expect(
          page.getByText("a new blog title one by author one added")
        ).toBeVisible()
      })
      describe("after new blog is created", () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, "title two", "John Smith", "https://url.one")
        })
        test("blog can be liked", async ({ page }) => {
          await page.getByRole("button", { name: "view" }).click()
          const likespan = page.locator(".likes")
          await expect(likespan).toContainText("0")
          await page.getByRole("button", { name: "like" }).click()
          await expect(likespan).toContainText("1")
        })
        test("a new blog can be deleted by the user", async ({ page }) => {
          await page.getByRole("button", { name: "view" }).click()
          await page.getByRole("button", { name: "delete" }).click()
          page.on("dialog", async (dialog) => {
            expect(dialog.message()).toEqual(
              "Remove blog title two by John Smith"
            )
            await dialog.accept()
          })
        })
      })
    })
  })
})
describe("multiple users and blogs exist", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("/api/testing/reset")
    await request.post("/api/users", {
      data: {
        name: "Matti Luukkainen",
        username: "mluukkai",
        password: "salainen",
      },
    })
    await request.post("/api/users", {
      data: {
        name: "Test Name",
        username: "testname",
        password: "pw123",
      },
    })
    await page.goto("")
    await loginWith(page, "mluukkai", "salainen")
    await createBlog(page, "Title One", "Author One", "Url One")
    await createBlog(page, "Title Two", "Author Two", "Url Two")

    await page.getByRole("button", { name: "view" }).first().click()

    await page.getByRole("button", { name: "view" }).first().click()

    await page.getByRole("button", { name: "logout" }).click()

    await loginWith(page, "testname", "pw123")
    await createBlog(page, "title ABC", "Tom Blue", "https://tom.one/abc")
    const element = await page.getByText("title ABC Tom Blue")
    await element.getByRole("button", { name: "view" }).click()
    await element.locator("..").getByRole("button", { name: "like" }).click()
  })
  test("only the user who added the blog sees the blog's delete button", async ({
    page,
  }) => {
    const count = await page.getByRole("button", { name: "view" }).count()
    for (let i = 0; i < count; i++) {
      await page.getByRole("button", { name: "view" }).first().click()
    }
    const otherUsersElement = page.getByText("Test Name")
    await expect(otherUsersElement).toHaveCount(1)
    await expect(
      otherUsersElement.locator("..").getByRole("button", { name: "delete" })
    ).toBeVisible()

    await expect(page.getByRole("button", { name: "delete" })).toHaveCount(1)
    const detailElement = page.locator(".detail")
    await expect(detailElement).toHaveCount(3)
  })
  test("Blogs are listed arrenged order according to likes", async ({
    page,
  }) => {
    const count = await page.getByRole("button", { name: "view" }).count()
    for (let i = 0; i < count; i++) {
      await page.getByRole("button", { name: "view" }).first().click()
    }

    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "like" }).first().click()
    }
    await page.getByRole("button", { name: "like" }).last().click()
    let biggestNum = parseInt(await page.locator(".likes").first().innerText())
    for (const number of await page.locator(".likes").allInnerTexts()) {
      expect(biggestNum).toBeGreaterThanOrEqual(parseInt(number))
    }
  })
})
