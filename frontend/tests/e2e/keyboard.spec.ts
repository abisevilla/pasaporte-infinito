import { expect, test } from "@playwright/test";
import { fitsViewport } from "./helpers";

test("aventura con teclado, ayuda, fuentes, cuaderno y diálogo", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Seis ciudades/ }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("button", { name: "Seleccionar Madrid", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Madrid", exact: true }),
  ).toBeVisible();
  for (let count = 0; count < 20; count++) {
    await page.keyboard.press("ArrowRight");
    if (
      await page
        .getByRole("heading", { name: "Una apertura en 1819" })
        .isVisible()
    )
      break;
  }
  await expect(
    page.getByRole("heading", { name: "Una apertura en 1819" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("heading", { name: "Antes de los cuadros" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Registrar escena 2 de 3" }),
  ).toBeVisible();
  await page.keyboard.press("j");
  await expect(
    page.getByRole("heading", { name: "Tu cuaderno de viaje" }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.getByRole("button", { name: "Fuentes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fuentes de la escena" }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Tu cuaderno de viaje" }),
  ).toBeVisible();
  await page.keyboard.press("j");
  await expect(
    page.getByRole("button", { name: "Registrar escena 2 de 3" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Registrar escena 3 de 3" }),
  ).toBeVisible();
  // Las flechas de lectura no registran escenas por su cuenta.
  await expect(
    page.getByRole("button", { name: "Registrar escena 3 de 3" }),
  ).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.getByRole("radio").first()).toBeEnabled();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("radio", { name: /Juan de Villanueva$/ }),
  ).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "¡Respuesta correcta!" }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radio")).toHaveCount(4);
  await page.keyboard.press("h");
  await expect(
    page.getByRole("heading", { name: "Controles y reglas" }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("radio")).toHaveCount(4);
  await page.getByRole("button", { name: "Nuevo itinerario" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});

test("pantallas pequeñas, texto paginado y ausencia de scroll", async ({
  page,
}, info) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 640, height: 360 },
    { width: 320, height: 480 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Elegir mi origen →" }),
    ).toBeVisible();
    await fitsViewport(page);
    await page.keyboard.press("h");
    await expect(
      page.getByRole("heading", { name: "Controles y reglas" }),
    ).toBeVisible();
    await fitsViewport(page);
    let text = "";
    for (let count = 0; count < 100; count++) {
      text += await page
        .locator(".reader-copy:not(.reader-probe)")
        .textContent();
      const next = page.getByRole("button", {
        name: "Página de texto siguiente",
      });
      if (await next.isDisabled()) break;
      await page.keyboard.press("ArrowRight");
      await fitsViewport(page);
    }
    expect(text).toContain("El contenido largo");
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowRight");
    await fitsViewport(page);
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await fitsViewport(page);
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Madrid", exact: true }),
    ).toBeVisible();
    await fitsViewport(page);
    await page.getByRole("button", { name: "Fuentes", exact: true }).click();
    await fitsViewport(page);
    await page.keyboard.press("Escape");
    for (let index = 1; index <= 3; index++)
      await page
        .getByRole("button", { name: `Registrar escena ${index} de 3` })
        .click();
    await expect(
      page.getByRole("button", { name: "Comprobar respuesta" }),
    ).toBeVisible();
    await fitsViewport(page);
    await page.screenshot({
      path: info.outputPath(
        `pregunta-${viewport.width}-${viewport.height}.png`,
      ),
      scale: "css",
    });
    await page.context().clearCookies();
  }
});
