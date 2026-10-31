import { expect, test } from "@playwright/test";

test("FastAPI entrega la compilación y sus recursos locales", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:8000/");
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Seleccionar / })).toHaveCount(
    6,
  );
  await expect(
    page.getByRole("region", { name: "Mapa de destinos" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
