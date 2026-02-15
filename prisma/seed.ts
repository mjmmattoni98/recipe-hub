import "dotenv/config";
import { list } from "@vercel/blob";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const getBlobListOptions = (cursor?: string) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    return { cursor, token };
  }

  return { cursor };
};

async function getBlobImagesByFilename() {
  const byFilename = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const page = await list(getBlobListOptions(cursor));

    for (const blob of page.blobs) {
      const segments = blob.pathname.split("/").filter(Boolean);
      const filename = segments.at(-1);

      if (filename && !byFilename.has(filename)) {
        byFilename.set(filename, blob.url);
      }
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return byFilename;
}

const recipesData: Prisma.RecipeCreateInput[] = [
  {
    title: "Lasanya de Carbassa, Ricotta i Espinacs",
    description:
      "Una recepta de temporada saludable on la pasta es substitueix per làmines de carbassa, farcida amb una cremosa mescla de ricotta, espinacs i tomàquet sec.",
    cuisine: "Mediterrània",
    difficulty: "Medium",
    cookTime: 40,
    prepTime: 30,
    servings: 4,
    ingredients: [
      "2 carbasses mitjanes",
      "450g ricotta",
      "500g espinacs",
      "2 cebes xalotes",
      "1 all tendre",
      "tomàquet sec",
      "formatge per gratinar",
      "oli d’oliva",
    ],
    instructions: [
      "Preescalfa el forn a 200 graus amb ventilador a dalt i a baix.",
      "Talla la carbassa en làmines/rodanxes fines d’uns 3mm aproximadament.",
      "Posa les làmines en una safata amb oli, cobreix-les amb paper de forn i cuina-les durant 15 minuts.",
      "Sofregeix les cebes i l’all tendre tallats petits en una paella a foc lent.",
      "Afegeix tomàquet sec tallat i després els espinacs. Cuina fins que s'evapori l'aigua.",
      "Barreja les verdures cuites amb la ricotta fora del foc.",
      "Munta la lasanya alternant capes de carbassa i mescla de ricotta.",
      "Acaba amb una capa de carbassa i cobreix amb formatge ratllat.",
      "Gratina al forn fins que el formatge estigui desfet i torrat.",
    ],
    image: "lasanya-carbassa-ricotta-espinacs.png",
    tags: ["vegetarian", "gluten-free", "healthy", "seasonal"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRwyG72jW4S/",
      },
    },
  },
  {
    title: "Pizza Casera con Bacon, Espinacas y Huevo",
    description:
      "Una pizza rápida y completa con una combinación sabrosa de bacon, espinacas, aceitunas y un huevo al horno sobre una base crujiente.",
    cuisine: "Italiana",
    difficulty: "Easy",
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    ingredients: [
      "base de pizza",
      "tomate frito",
      "queso",
      "bacon",
      "espinacas",
      "aceitunas con anchoas",
      "1 huevo",
    ],
    instructions: [
      "Precalienta el horno (temperatura estándar para pizza, unos 200-220°C).",
      "Extiende el tomate frito sobre la base de pizza.",
      "Añade el queso, el bacon, las espinacas y las aceitunas distribuyéndolos uniformemente.",
      "Rompe el huevo y colócalo con cuidado sobre la pizza.",
      "Hornea durante 15-20 minutos hasta que la masa esté dorada y el huevo en su punto.",
    ],
    image: "pizza-casera-bacon-espinacas-huevo.png",
    tags: ["pizza", "comfort food", "quick dinner"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRIRWgViLdN/",
      },
    },
  },
  {
    title: "Sopa de Vegetales y Fideos",
    description:
      "Una sopa nutritiva y versátil donde las verduras se doran y trituran para aportar sabor y cuerpo al caldo, finalizando con unos fideos.",
    cuisine: "Internacional",
    difficulty: "Easy",
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    ingredients: [
      "verduras variadas al gusto",
      "fideos (opcional)",
      "caldo o agua",
      "aceite",
    ],
    instructions: [
      "Lava y trocea las verduras que hayas elegido.",
      "Dora las verduras en una olla con un poco de aceite para potenciar el sabor.",
      "Retira las verduras y tritúralas hasta obtener un puré.",
      "Añade las verduras trituradas al caldo caliente.",
      "Incorpora los fideos y cocina el tiempo indicado hasta que estén listos.",
    ],
    image: "sopa-vegetales-fideos.png",
    tags: ["vegan", "vegetarian", "healthy", "soup", "comfort food"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRkeJ5IiCZx/",
      },
    },
  },
  {
    title: "Rollitos de Jamón, Salmón y Guacamole",
    description:
      "Un aperitivo fresco y sabroso tipo sushi, donde una base de jamón envuelve un relleno cremoso de salmón ahumado, quesos y guacamole, finalizado con un toque exótico de salsa thai.",
    cuisine: "Fusión",
    difficulty: "Easy",
    cookTime: 0,
    prepTime: 15,
    servings: 4,
    ingredients: [
      "Jamón en lonchas",
      "Salmón ahumado",
      "Queso mozzarella",
      "Guacamole",
      "Queso Philadelphia",
      "Salsa thai",
      "Sésamo tostado",
    ],
    instructions: [
      "Extiende una lámina de papel film sobre una superficie plana.",
      "Coloca las lonchas de jamón sobre el film, superponiéndolas ligeramente para crear una base rectangular unida.",
      "Distribuye en el centro el salmón ahumado, el queso mozzarella, el queso Philadelphia y el guacamole.",
      "Enrolla el conjunto con ayuda del papel film, presionando para que quede un rollo compacto.",
      "Retira el film, corta si es necesario y sirve decorando por encima con salsa thai y sésamo tostado.",
    ],
    image: "rollitos-jamon-salmon-guacamole.png",
    tags: ["appetizer", "keto", "low carb", "no-cook"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DKwxi7gqXVW/",
      },
    },
  },
  {
    title: "Calzone de Pollo Sin Harina (Keto)",
    description:
      "Una versión saludable y alta en proteínas del clásico calzone, sustituyendo la masa de harina por una base de pollo picado, rellena de jamón, queso y tomate con un crujiente rebozado de parmesano.",
    cuisine: "Keto / Fusión",
    difficulty: "Medium",
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    ingredients: [
      "2 pechugas de pollo picadas",
      "2 cucharadas de queso crema",
      "2 lonchas de queso mozzarella",
      "1 tomate en rodajas",
      "2 lonchas de jamón cocido",
      "1 huevo (para rebozar)",
      "100g queso parmesano en polvo (para rebozar)",
    ],
    instructions: [
      "Prepara la base extendiendo la pechuga de pollo picada (puedes integrarla con el queso crema para dar consistencia o usar este en el relleno).",
      "Coloca sobre la mitad de la base de pollo el relleno: lonchas de mozzarella, rodajas de tomate y el jamón cocido.",
      "Cierra el calzone doblando la otra mitad del pollo sobre el relleno y sella bien los bordes.",
      "Pasa la pieza por huevo batido y rebózala en el queso parmesano en polvo.",
      "Cocina en la Airfryer durante 15 minutos a 195ºC, o en el horno durante 20 minutos a 195ºC.",
    ],
    image: "calzone-pollo-sin-harina-keto.png",
    tags: ["gluten-free", "keto", "high protein", "airfryer", "dinner"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DQjWu6kjSbW/",
      },
    },
  },
  {
    title: "Patatas Rellenas de Huevo y Cebolla Caramelizada",
    description:
      "Una versión económica y original que recuerda a la tortilla de patatas: patatas asadas rellenas de una mezcla rústica de su propia pulpa, huevo, cebolla caramelizada y queso Gouda gratinado.",
    cuisine: "Española / Casera",
    difficulty: "Medium",
    cookTime: 65,
    prepTime: 20,
    servings: 4,
    ingredients: [
      "4 patatas medianas",
      "3 huevos",
      "80g de queso Gouda rallado",
      "1 cebolla mediana",
      "1-2 cucharaditas de aceite",
      "Sal y pimienta",
      "Cebolla en polvo",
      "Ajo en polvo",
    ],
    instructions: [
      "Lava las patatas y hornéalas enteras durante 50-60 minutos a 200°C hasta que estén blandas.",
      "Pica la cebolla y sofríela con un poco de aceite y sal a fuego medio/bajo (10-12 min) hasta que esté caramelizada.",
      "Cocina los huevos a la plancha o en sartén.",
      "Corta las patatas asadas por la mitad y vacía la pulpa con cuidado de no romper la piel.",
      "En un bol, mezcla la pulpa de la patata, la cebolla caramelizada, los huevos cocinados (dejando trozos visibles) y la mitad del queso. Sazona con sal, pimienta, ajo y cebolla en polvo.",
      "Rellena las pieles de las patatas con la mezcla.",
      "Cubre con el resto del queso Gouda por encima.",
      "Gratina en el horno 5 minutos a 220°C hasta que el queso se derrita y dore.",
    ],
    image: "patatas-rellenas-huevo-cebolla.png",
    tags: [
      "vegetarian",
      "gluten-free",
      "budget-friendly",
      "dinner",
      "comfort food",
    ],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRXBfjFjdpr/",
      },
    },
  },
  {
    title: "Pasta con Salsa de Calabaza, Mascarpone y Lima",
    description:
      "Una salsa increíblemente cremosa y fácil de preparar, donde el dulzor de la calabaza asada se equilibra con la suavidad del mascarpone y el toque ácido de la lima.",
    cuisine: "Italiana / Moderna",
    difficulty: "Easy",
    cookTime: 25,
    prepTime: 10,
    servings: 2,
    ingredients: [
      "200-250g de pasta corta (tipo penne o rigatoni)",
      "400g de calabaza pelada y cortada en dados",
      "3-4 dientes de ajo",
      "80g de queso Mascarpone",
      "1 lima (ralladura y zumo)",
      "Aceite de oliva virgen extra",
      "Sal y pimienta negra",
    ],
    instructions: [
      "Pon los dados de calabaza y los ajos (con piel) en una bandeja de horno o airfryer con un poco de aceite y sal. Hornea a 200°C durante 20-25 minutos hasta que estén tiernos.",
      "Mientras tanto, cuece la pasta en agua hirviendo con sal hasta que esté al dente. Reserva media taza del agua de cocción antes de escurrir.",
      "Pela los ajos asados y colócalos en un vaso batidor junto con la calabaza asada, el mascarpone, sal, pimienta y un chorrito de aceite.",
      "Tritura todo hasta obtener una salsa fina y sedosa.",
      "Mezcla la pasta caliente con la salsa. Si queda muy espesa, añade un poco del agua de cocción reservada para darle cremosidad.",
      "Sirve inmediatamente decorando con ralladura de lima y un chorrito de zumo de lima por encima.",
    ],
    image: "pasta-calabaza-mascarpone-lima.png",
    tags: ["vegetarian", "pasta", "easy", "creamy", "winter"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DDKzdJOo-nW/",
      },
    },
  },
  {
    title: "Hojaldritos Navideños de Brie, Panceta y Miel",
    description:
      "Un aperitivo festivo infalible que combina lo dulce y lo salado. Estos pañuelos de hojaldre rellenos de cebolla caramelizada, panceta y queso brie son fáciles de hacer y perfectos para lucirse en Navidad.",
    cuisine: "Festiva / Aperitivos",
    difficulty: "Easy",
    cookTime: 20,
    prepTime: 15,
    servings: 6,
    ingredients: [
      "1 plancha de hojaldre rectangular",
      "Cebolla caramelizada",
      "Panceta curada (en trocitos)",
      "Queso Brie (cortado en dados)",
      "1 huevo batido",
      "20 mitades de nueces",
      "Miel",
    ],
    instructions: [
      "Precalienta el horno a 220°C con calor arriba y abajo (sin ventilador).",
      "Extiende la plancha de hojaldre y córtala en 20 cuadrados aproximadamente iguales.",
      "Coloca en el centro de cada cuadrado una cucharada de cebolla caramelizada, unos trocitos de panceta curada y un dado de queso Brie.",
      "Cierra cada pieza juntando las esquinas hacia el centro formando un pañuelito o saquito.",
      "Pinta la superficie con huevo batido y presiona una nuez en la parte superior (en el cierre).",
      "Hornea durante 15-20 minutos hasta que el hojaldre esté inflado y bien dorado.",
      "Retira del horno y sirve inmediatamente decorando con unos hilitos de miel por encima.",
    ],
    image: "hojaldritos-navidad-brie-panceta.png",
    tags: [
      "christmas",
      "appetizer",
      "puff-pastry",
      "sweet-salty",
      "finger-food",
    ],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRNS07QCPwO/",
      },
    },
  },
  {
    title: "Pastel de Carrilleras al Vino Tinto",
    description:
      "Una receta festiva de carrilleras melosas guisadas con vino tinto y un toque secreto de chocolate, cubiertas de un puré de patata cremoso. Un plato principal ideal para Navidad que gana sabor si se prepara con antelación.",
    cuisine: "Española / Festiva",
    difficulty: "Medium",
    cookTime: 60,
    prepTime: 25,
    servings: 4,
    ingredients: [
      "1 kg de carrilleras (cerdo o ternera)",
      "1 cebolla",
      "1 puerro",
      "2 zanahorias",
      "300ml de vino tinto",
      "200ml de agua o caldo",
      "1-2 onzas de chocolate negro 75%",
      "600g de patatas",
      "20g de mantequilla",
      "Un chorrito de leche",
      "Sal y pimienta",
      "Aceite de oliva virgen extra",
    ],
    instructions: [
      "Salpimienta las carrilleras y marca en la olla exprés con un poco de aceite hasta que se doren. Retira y reserva.",
      "En el mismo aceite, sofríe la cebolla, el puerro y las zanahorias picadas hasta que cojan color.",
      "Reincorpora las carrilleras, añade el vino tinto y el agua (o caldo). Cierra la olla exprés y cocina 35 minutos desde que suba la válvula.",
      "Mientras, cuece las patatas peladas en agua con sal hasta que estén blandas. Escurre y chafa con la mantequilla, la leche, sal y pimienta hasta obtener un puré cremoso.",
      "Abre la olla, saca la carne y desmigala. Añade el chocolate a la salsa caliente para que se funda y espese la mezcla (puedes triturar la salsa antes si la prefieres fina). Mezcla la carne desmigada con la salsa.",
      "Monta el pastel en una fuente: coloca una base con la mezcla de carne y cubre con el puré de patata.",
      "Gratina unos minutos en el horno antes de servir para que la superficie se dore.",
    ],
    image: "pastel-carrilleras-vino.png",
    tags: ["christmas", "meat", "make-ahead", "main-course", "gluten-free"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRaCd0fDB__/",
      },
    },
  },
  {
    title: "Gnocchis con Crema de Queso en Air Fryer",
    description:
      "Una receta 'todo en uno' perfecta para meal prep y alta en proteínas (53g). Se cocina todo junto en el propio recipiente dentro de la air fryer, creando una salsa cremosa sin ensuciar apenas utensilios.",
    cuisine: "Saludable / Express",
    difficulty: "Easy",
    cookTime: 18,
    prepTime: 5,
    servings: 1,
    ingredients: [
      "130g de gnocchis",
      "100g de pechuga de pollo cruda en taquitos",
      "70g de tomates cherry",
      "30g de champiñones",
      "50g de queso crema light",
      "20g de queso cheddar curado rallado",
    ],
    instructions: [
      "En un recipiente apto para horno o air fryer (tupper de vidrio), coloca los gnocchis, los champiñones troceados, los tomates cherry, el pollo en dados y el queso crema.",
      "Introduce el recipiente en la Air Fryer y cocina a 180°C durante 18 minutos.",
      "Retira el recipiente con cuidado y mezcla todo bien para que el queso crema y los jugos del pollo se integren formando la salsa.",
      "Añade el queso cheddar rallado por encima para terminar el plato y que se funda con el calor residual.",
    ],
    image: "gnocchis-crema-queso-airfryer.png",
    tags: ["air-fryer", "high-protein", "meal-prep", "lunch", "healthy"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRQAmquik3e/",
      },
    },
  },
  {
    title: "Quesadillas de Pollo al Pesto",
    description:
      "La receta salvavidas para cuando cocinar parece imposible. Una quesadilla crujiente y llena de sabor con pollo, pesto y mucho queso, lista en menos de 15 minutos.",
    cuisine: "Fusión / Rápida",
    difficulty: "Easy",
    cookTime: 8,
    prepTime: 5,
    servings: 1,
    ingredients: [
      "2 tortillas de trigo grandes",
      "120g de pollo cocido (desmenuzado o troceado)",
      "2 cucharadas de pesto de albahaca",
      "100g de queso mozzarella rallado",
      "Un puñado de espinacas y tomates cherry (opcional)",
      "1 cucharada de aceite de oliva o mantequilla",
      "Salsa Ranchera Rápida: 2 cdas mayonesa, 1 cda yogur griego, especias (cebolla, ajo, eneldo), limón",
    ],
    instructions: [
      "Prepara la salsa rápida mezclando la mayonesa, el yogur griego, ajo en polvo, cebolla en polvo, eneldo, pimienta y un chorrito de zumo de limón. Reserva.",
      "En un bol, mezcla el pollo cocido con el pesto. Prueba y ajusta de sal/pimienta si es necesario.",
      "Coloca una tortilla. En una mitad, pon una capa de mozzarella, luego el pollo al pesto, las espinacas/tomates (si usas) y otra capa ligera de queso. Dobla la tortilla para cerrar.",
      "Calienta una sartén a fuego medio. Añade un poco de mantequilla o aceite.",
      "Cocina la quesadilla 3-4 minutos por cada lado hasta que esté dorada y el queso se haya derretido.",
      "Deja reposar 1 minuto, corta en triángulos y sirve con la salsa ranchera.",
    ],
    image: "quesadillas-pollo-pesto.png",
    tags: ["chicken", "pesto", "quick-dinner", "high-protein", "quesadilla"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRj1oOJjP-L/",
      },
    },
  },
  {
    title: "Döner Kebap Casero Viral",
    description:
      "Una receta viral que revoluciona la forma de comer kebab en casa. El secreto está en aplanar la carne muy fina para conseguir trozos tostados y crujientes con todo el sabor de las especias.",
    cuisine: "Turca / Viral",
    difficulty: "Easy",
    cookTime: 20,
    prepTime: 15,
    servings: 4,
    ingredients: [
      "Carne picada de ternera",
      "1 cebolla",
      "2 dientes de ajo",
      "1 cucharada de pimentón dulce",
      "1 cucharada de orégano",
      "Comino en polvo",
      "Sal",
      "Pan de pita",
      "Queso",
      "Salsa: Yogur natural, 1 ajo, menta/hierbabuena, aceite",
    ],
    instructions: [
      "Ralla la cebolla y los 2 dientes de ajo utilizando la parte más fina del rallador.",
      "En un bol, mezcla la carne picada con la cebolla y el ajo rallados, el pimentón, el orégano, el comino y la sal. Amasa bien para integrar los sabores.",
      "Deja reposar la mezcla 10 minutos mientras precalientas el horno a 200°C.",
      "Coloca la carne sobre un papel de horno, pon otro papel encima y aplástala con un rodillo hasta que quede una lámina muy fina (hazlo en tandas si es mucha cantidad).",
      "Coloca la lámina de carne en la bandeja del horno (enrollándola o transfiriéndola con cuidado) y hornea durante 20 minutos hasta que esté bien dorada.",
      "Mientras, prepara la salsa mezclando el yogur, un ajo rallado, menta picada, sal y un chorrito de aceite.",
      "Saca la carne del horno y rómpela en trozos irregulares con las manos o un cuchillo para imitar el corte del kebab.",
      "Monta el pan de pita con la salsa, cebolla, la carne crujiente, queso y los extras que desees.",
    ],
    image: "doner-kebap-viral.png",
    tags: ["meat", "fakeaway", "viral", "dinner", "kebab"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://www.instagram.com/reel/DRrgQ7qDH0X/",
      },
    },
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  const blobImagesByFilename = await getBlobImagesByFilename();

  // Clear existing data
  await prisma.videoSource.deleteMany();
  await prisma.recipe.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create recipes
  for (const recipe of recipesData) {
    const filename = recipe.image.split("/").filter(Boolean).at(-1);

    if (!filename) {
      throw new Error(`Invalid image value for recipe: ${recipe.title}`);
    }

    const blobUrl = blobImagesByFilename.get(filename);

    if (!blobUrl) {
      throw new Error(`Blob image not found for file: ${filename}`);
    }

    await prisma.recipe.create({
      data: {
        ...recipe,
        image: blobUrl,
      },
    });
  }

  console.log(`✅ Created ${recipesData.length} recipes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
