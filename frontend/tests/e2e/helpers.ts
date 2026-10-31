import { expect, type Page } from "@playwright/test";

export async function startScreen(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Elegir mi origen →" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Elegir mi origen →" }).click();
}
export async function begin(page: Page, city: string) {
  await startScreen(page);
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: `Seleccionar ${city}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Comenzar mi viaje" }).click();
  await expect(
    page.getByRole("heading", { name: city, exact: true, level: 1 }),
  ).toBeVisible();
}
export async function explore(page: Page) {
  for (let index = 1; index <= 3; index++)
    await page
      .getByRole("button", { name: `Registrar escena ${index} de 3` })
      .click();
  await expect(
    page.getByRole("button", { name: "Comprobar respuesta" }),
  ).toBeVisible();
}
export async function fitsViewport(page: Page) {
  // También comprobamos el contenido: ocultar el overflow por sí solo no basta.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const selectors = [
          ".app-shell",
          "main",
          ".screen",
          ".screen-actions",
          ".screen-heading",
          ".answer-grid",
          ".city-choices",
          ".reader-viewport",
        ];
        const failures: string[] = [];
        for (const selector of selectors) {
          for (const element of document.querySelectorAll<HTMLElement>(
            selector,
          )) {
            const box = element.getBoundingClientRect();
            if (!box.width || !box.height) continue;
            if (
              box.top < -1 ||
              box.bottom > innerHeight + 1 ||
              box.left < -1 ||
              box.right > innerWidth + 1
            )
              failures.push(selector + ": fuera de ventana");
            if (
              element.scrollHeight > element.clientHeight + 2 ||
              element.scrollWidth > element.clientWidth + 2
            )
              failures.push(
                selector +
                  ": contenido recortado " +
                  JSON.stringify([
                    element.clientWidth,
                    element.scrollWidth,
                    element.clientHeight,
                    element.scrollHeight,
                  ]),
              );
          }
        }
        if (
          scrollY !== 0 ||
          document.documentElement.scrollHeight > innerHeight + 1
        )
          failures.push("scroll del documento");
        return failures;
      }),
    )
    .toEqual([]);
}
