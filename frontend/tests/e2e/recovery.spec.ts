import { expect, test } from "@playwright/test";
import { begin, explore } from "./helpers";

for (const saved of [false, true]) {
  test(`reintenta la misma respuesta si se pierde ${saved ? "la confirmación" : "la conexión"}`, async ({
    page,
  }) => {
    await begin(page, "Madrid");
    await explore(page);
    const answer = page.getByRole("radio", { name: /Juan de Villanueva$/ });
    await answer.check();
    const attempts: string[] = [];
    let restored = false;
    await page.route("**/api/v1/games/current/actions", async (route) => {
      attempts.push(route.request().postDataJSON().requestId);
      if (restored) await route.continue();
      else if (saved && attempts.length === 1) {
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        await route.abort();
      } else {
        await route.abort();
      }
    });
    await page.getByRole("button", { name: "Comprobar respuesta" }).click();
    const retry = page.getByRole("button", { name: "Reintentar" });
    await expect(retry).toBeVisible();
    await expect(answer).toBeChecked();
    restored = true;
    await retry.click();
    await expect(
      page.getByRole("heading", { name: "¡Respuesta correcta!" }),
    ).toBeVisible();
    expect(new Set(attempts).size).toBe(1);
    const response = await page.request.get("/api/v1/games/current");
    expect((await response.json()).version).toBe(4);
  });
}

test("persiste la preferencia de atajos y restaura el foco al volver", async ({
  page,
}) => {
  await page.goto("/");
  const help = page.getByRole("button", { name: /Ayuda/ });
  await help.click();
  const toggle = page.getByRole("checkbox", {
    name: "Activar atajos H, J y ?",
  });
  await toggle.uncheck();
  await page.getByRole("button", { name: "Volver al juego" }).click();
  await expect(help).toBeFocused();
  await page.reload();
  await page.getByRole("heading", { name: /Seis ciudades/ }).waitFor();
  await page.keyboard.press("h");
  await expect(toggle).not.toBeVisible();
  await help.click();
  await expect(toggle).not.toBeChecked();
});
