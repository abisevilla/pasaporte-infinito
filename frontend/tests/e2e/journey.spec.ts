import { expect, test, type Page } from "@playwright/test";

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
  Barcelona: ["1882", "Antoni Gaudí", "San Bernabé"],
  París: ["Leonardo da Vinci", "Tabla de álamo", "Las bodas de Caná"],
  Roma: ["Vespasiano", "80 d. C.", "Anfiteatro Flavio"],
  "Nueva York": ["4 de julio de 1776", "Siete", "1986"],
  "Washington D. C.": ["George Washington", "Un obelisco", "1884"],
};

async function begin(page: Page, name: string) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Comenzar mi viaje" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: `Seleccionar ${name}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Comenzar mi viaje" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name, exact: true }),
  ).toBeVisible();
}
async function explore(page: Page) {
  for (let index = 1; index <= 3; index++) {
    await page
      .getByRole("button", { name: `Registrar escena ${index} de 3` })
      .click();
  }
  await expect(page.getByRole("heading", { name: /¿/ })).toBeVisible();
}
async function complete(page: Page, name: string) {
  await explore(page);
  for (const answer of answers[name]) {
    await page
      .getByRole("radio", {
        name: new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"),
      })
      .check();
    await page.getByRole("button", { name: "Comprobar respuesta" }).click();
  }
}
for (const city of cities) {
  test(`origen libre y recuperación: ${city}`, async ({ page }, testInfo) => {
    if (city === "Madrid") {
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Comenzar mi viaje" }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("inicio.png"),
        fullPage: true,
      });
    }
    await begin(page, city);
    await page.getByRole("button", { name: "Registrar escena 1 de 3" }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: city, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Registrar escena 2 de 3" }),
    ).toBeVisible();
    if (city === "Madrid")
      await page.screenshot({
        path: testInfo.outputPath("partida.png"),
        fullPage: true,
      });
  });
}
test("tres ciudades, epílogo y cuaderno", async ({ page }) => {
  await begin(page, "Madrid");
  for (const [index, name] of ["Madrid", "París", "Roma"].entries()) {
    if (index) {
      await page
        .getByRole("button", { name: `Seleccionar ${name}`, exact: true })
        .click();
      await page.getByRole("button", { name: "Viajar a esta ciudad" }).click();
    }
    await complete(page, name);
  }
  await expect(
    page.getByRole("heading", { name: "Hay viajes que se quedan contigo." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir cuaderno de viaje" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu cuaderno de viaje" }),
  ).toBeVisible();
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
