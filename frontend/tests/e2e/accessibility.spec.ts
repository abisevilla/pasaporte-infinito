import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { startScreen } from "./helpers";

test("accesibilidad de origen y desafío", async ({ page }) => {
  await startScreen(page);
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeVisible();
  const initial = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    initial.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Seleccionar Madrid", exact: true })
    .click();
  await page.getByRole("button", { name: "Comenzar mi viaje" }).click();
  for (let index = 1; index <= 3; index++)
    await page
      .getByRole("button", { name: `Registrar escena ${index} de 3` })
      .click();
  await expect(
    page.getByRole("button", { name: "Comprobar respuesta" }),
  ).toBeVisible();
  const challenge = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    challenge.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
});
