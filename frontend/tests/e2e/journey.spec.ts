import { expect, test } from "@playwright/test";
import { begin, explore, fitsViewport } from "./helpers";

const cities = [
  "Madrid",
  "Barcelona",
  "París",
  "Roma",
  "Nueva York",
  "Washington D. C.",
];
const answers: Record<string, string[]> = {
  Madrid: ["Juan de Villanueva", "1819", "Un gabinete de historia natural"],
  París: ["Leonardo da Vinci", "Tabla de álamo", "Las bodas de Caná"],
  Roma: ["Vespasiano", "80 d. C.", "Anfiteatro Flavio"],
};
for (const city of cities)
  test(`origen libre y recuperación: ${city}`, async ({ page }, info) => {
    await begin(page, city);
    await page.getByRole("button", { name: "Registrar escena 1 de 3" }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: city, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Registrar escena 2 de 3" }),
    ).toBeVisible();
    await fitsViewport(page);
    if (city === "Madrid")
      await page.screenshot({
        path: info.outputPath("partida.png"),
        scale: "css",
      });
  });
test("tres ciudades, epílogo y cuaderno", async ({ page }) => {
  await begin(page, "Madrid");
  for (const [index, name] of ["Madrid", "París", "Roma"].entries()) {
    if (index) {
      await page
        .getByRole("button", { name: `Seleccionar ${name}`, exact: true })
        .click();
      await page.getByRole("button", { name: "Viajar a esta ciudad" }).click();
    }
    await explore(page);
    for (const answer of answers[name]) {
      await page
        .getByRole("radio", {
          name: new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"),
        })
        .check();
      await page.getByRole("button", { name: "Comprobar respuesta" }).click();
      await expect(
        page.getByRole("heading", { name: "¡Respuesta correcta!" }),
      ).toBeVisible();
      await fitsViewport(page);
      await page.getByRole("button", { name: "Continuar →" }).click();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Hay viajes que se quedan contigo." }),
  ).toBeVisible();
  await fitsViewport(page);
  await page
    .getByRole("button", { name: "Abrir cuaderno de viaje", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu cuaderno de viaje" }),
  ).toBeVisible();
  await fitsViewport(page);
  await page.getByRole("button", { name: "Cerrar cuaderno" }).click();
  await expect(
    page.getByRole("button", { name: "Comenzar otra aventura" }),
  ).toBeVisible();
});
test("tercer error, reinicio y selección sin origen preseleccionado", async ({
  page,
}) => {
  await begin(page, "Madrid");
  await explore(page);
  for (let index = 0; index < 3; index++) {
    await page.getByRole("radio", { name: /Antoni Gaudí$/ }).check();
    await page.getByRole("button", { name: "Comprobar respuesta" }).click();
    await page.getByRole("button", { name: "Continuar →" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Este viaje termina aquí." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Comenzar otra aventura" }).click();
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Seleccionar / })).toHaveCount(
    6,
  );
});
