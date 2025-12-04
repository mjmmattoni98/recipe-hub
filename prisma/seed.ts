import "dotenv/config";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const recipesData: Prisma.RecipeCreateInput[] = [
  {
    title: "Classic Margherita Pizza",
    description:
      "A timeless Italian classic with fresh mozzarella, San Marzano tomatoes, and fragrant basil on a perfectly crispy crust.",
    cuisine: "Italian",
    difficulty: "Medium",
    cookTime: 25,
    prepTime: 90,
    servings: 4,
    ingredients: [
      "pizza dough",
      "mozzarella",
      "tomatoes",
      "basil",
      "olive oil",
      "garlic",
    ],
    instructions: [
      "Prepare the dough and let it rise for 1 hour",
      "Preheat oven to 475°F (245°C)",
      "Stretch dough into a circle",
      "Add crushed tomatoes, mozzarella, and drizzle with olive oil",
      "Bake for 12-15 minutes until crust is golden",
      "Top with fresh basil before serving",
    ],
    image: "/recipes/margherita-pizza.jpg",
    tags: ["vegetarian", "comfort food", "party"],
    videoSource: {
      create: {
        platform: "YouTube",
        url: "https://youtube.com/watch?v=example1",
      },
    },
  },
  {
    title: "Spicy Thai Basil Chicken",
    description:
      "A quick and fiery stir-fry featuring tender chicken, Thai basil, and a perfect balance of savory and spicy flavors.",
    cuisine: "Thai",
    difficulty: "Easy",
    cookTime: 15,
    prepTime: 10,
    servings: 2,
    ingredients: [
      "chicken breast",
      "thai basil",
      "garlic",
      "chili",
      "soy sauce",
      "fish sauce",
      "oyster sauce",
    ],
    instructions: [
      "Mince chicken into small pieces",
      "Heat wok over high heat with oil",
      "Stir-fry garlic and chilies until fragrant",
      "Add chicken and cook until golden",
      "Add sauces and stir to combine",
      "Toss in Thai basil and serve over rice",
    ],
    image: "/recipes/thai-basil-chicken.jpg",
    tags: ["spicy", "quick meal", "protein"],
    videoSource: {
      create: {
        platform: "TikTok",
        url: "https://tiktok.com/@example/video/123",
      },
    },
  },
  {
    title: "Creamy Tuscan Salmon",
    description:
      "Pan-seared salmon in a rich, garlicky cream sauce with sun-dried tomatoes and spinach.",
    cuisine: "Italian",
    difficulty: "Medium",
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    ingredients: [
      "salmon fillet",
      "spinach",
      "sun-dried tomatoes",
      "cream",
      "garlic",
      "parmesan",
    ],
    instructions: [
      "Season salmon with salt and pepper",
      "Sear salmon skin-side up for 4 minutes, flip and cook 3 more",
      "Remove salmon and sauté garlic",
      "Add sun-dried tomatoes and cream",
      "Stir in spinach until wilted",
      "Return salmon to pan and serve",
    ],
    image: "/recipes/tuscan-salmon.jpg",
    tags: ["seafood", "keto", "date night"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://instagram.com/reel/example",
      },
    },
  },
  {
    title: "Japanese Beef Gyudon",
    description:
      "Tender sliced beef simmered in a sweet soy broth, served over steaming rice with a soft-cooked egg.",
    cuisine: "Japanese",
    difficulty: "Easy",
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    ingredients: [
      "beef sirloin",
      "onion",
      "soy sauce",
      "mirin",
      "sake",
      "dashi",
      "egg",
      "rice",
    ],
    instructions: [
      "Slice beef thinly against the grain",
      "Simmer sliced onions in dashi, soy sauce, mirin, and sake",
      "Add beef slices and cook until just done",
      "Serve over hot rice",
      "Top with a soft-cooked egg and pickled ginger",
    ],
    image: "/recipes/beef-gyudon.jpg",
    tags: ["comfort food", "quick meal", "protein"],
    videoSource: {
      create: {
        platform: "YouTube",
        url: "https://youtube.com/watch?v=example2",
      },
    },
  },
  {
    title: "Classic French Onion Soup",
    description:
      "Deeply caramelized onions in rich beef broth, topped with crusty bread and melted Gruyère cheese.",
    cuisine: "French",
    difficulty: "Hard",
    cookTime: 90,
    prepTime: 20,
    servings: 4,
    ingredients: [
      "onions",
      "beef broth",
      "butter",
      "white wine",
      "gruyère",
      "baguette",
      "thyme",
    ],
    instructions: [
      "Slice onions thinly and caramelize in butter for 45 minutes",
      "Deglaze with white wine",
      "Add beef broth and thyme, simmer 20 minutes",
      "Ladle into oven-safe bowls",
      "Top with bread and cheese",
      "Broil until cheese is bubbly and golden",
    ],
    image: "/recipes/french-onion-soup.jpg",
    tags: ["comfort food", "winter", "vegetarian option"],
    videoSource: {
      create: {
        platform: "YouTube",
        url: "https://youtube.com/watch?v=example3",
      },
    },
  },
  {
    title: "Korean Bibimbap",
    description:
      "A colorful bowl of rice topped with seasoned vegetables, gochujang, and a perfectly fried egg.",
    cuisine: "Korean",
    difficulty: "Medium",
    cookTime: 30,
    prepTime: 30,
    servings: 2,
    ingredients: [
      "rice",
      "spinach",
      "carrots",
      "zucchini",
      "mushrooms",
      "bean sprouts",
      "egg",
      "gochujang",
      "sesame oil",
    ],
    instructions: [
      "Cook rice and keep warm",
      "Blanch and season each vegetable separately",
      "Fry egg sunny-side up",
      "Arrange vegetables and egg over rice",
      "Serve with gochujang and sesame oil",
      "Mix everything together before eating",
    ],
    image: "/recipes/bibimbap.jpg",
    tags: ["healthy", "colorful", "vegetarian option"],
    videoSource: {
      create: {
        platform: "TikTok",
        url: "https://tiktok.com/@example/video/456",
      },
    },
  },
  {
    title: "Mexican Street Tacos",
    description:
      "Authentic corn tortillas loaded with seasoned carne asada, fresh cilantro, onion, and zesty lime.",
    cuisine: "Mexican",
    difficulty: "Easy",
    cookTime: 15,
    prepTime: 20,
    servings: 4,
    ingredients: [
      "flank steak",
      "corn tortillas",
      "cilantro",
      "onion",
      "lime",
      "cumin",
      "garlic",
    ],
    instructions: [
      "Marinate steak with cumin, garlic, and lime juice",
      "Grill steak over high heat to medium-rare",
      "Rest and slice against the grain",
      "Warm tortillas on the grill",
      "Top with steak, onion, and cilantro",
      "Squeeze fresh lime over tacos",
    ],
    image: "/recipes/street-tacos.jpg",
    tags: ["street food", "grilling", "party"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://instagram.com/reel/example2",
      },
    },
  },
  {
    title: "Indian Butter Chicken",
    description:
      "Tender chicken in a velvety tomato-cream sauce with aromatic spices and a touch of sweetness.",
    cuisine: "Indian",
    difficulty: "Medium",
    cookTime: 40,
    prepTime: 30,
    servings: 4,
    ingredients: [
      "chicken thighs",
      "yogurt",
      "tomatoes",
      "cream",
      "butter",
      "garam masala",
      "ginger",
      "garlic",
      "kashmiri chili",
    ],
    instructions: [
      "Marinate chicken in yogurt and spices for 2 hours",
      "Grill or pan-fry chicken until charred",
      "Make sauce with butter, tomatoes, and cream",
      "Add spices and simmer until thickened",
      "Add chicken and simmer 10 more minutes",
      "Serve with basmati rice or naan",
    ],
    image: "/recipes/butter-chicken.jpg",
    tags: ["curry", "comfort food", "crowd pleaser"],
    videoSource: {
      create: {
        platform: "YouTube",
        url: "https://youtube.com/watch?v=example4",
      },
    },
  },
  {
    title: "Mediterranean Falafel Bowl",
    description:
      "Crispy homemade falafel served over fluffy couscous with fresh vegetables, hummus, and tahini drizzle.",
    cuisine: "Mediterranean",
    difficulty: "Medium",
    cookTime: 25,
    prepTime: 40,
    servings: 4,
    ingredients: [
      "chickpeas",
      "parsley",
      "cilantro",
      "cumin",
      "couscous",
      "cucumber",
      "tomatoes",
      "hummus",
      "tahini",
    ],
    instructions: [
      "Soak dried chickpeas overnight",
      "Blend with herbs and spices",
      "Form into balls and fry until golden",
      "Prepare couscous according to package",
      "Assemble bowl with all toppings",
      "Drizzle with tahini sauce",
    ],
    image: "/recipes/falafel-bowl.jpg",
    tags: ["vegan", "healthy", "meal prep"],
    videoSource: {
      create: {
        platform: "TikTok",
        url: "https://tiktok.com/@example/video/789",
      },
    },
  },
  {
    title: "Vietnamese Pho",
    description:
      "A soul-warming bowl of aromatic beef broth with rice noodles, tender beef, and fresh herbs.",
    cuisine: "Vietnamese",
    difficulty: "Hard",
    cookTime: 180,
    prepTime: 30,
    servings: 6,
    ingredients: [
      "beef bones",
      "rice noodles",
      "beef sirloin",
      "star anise",
      "cinnamon",
      "ginger",
      "onion",
      "bean sprouts",
      "thai basil",
      "lime",
    ],
    instructions: [
      "Roast bones, ginger, and onion",
      "Simmer with spices for 3 hours",
      "Strain broth and season",
      "Cook rice noodles separately",
      "Slice beef paper-thin",
      "Assemble bowls and pour hot broth over beef",
    ],
    image: "/recipes/pho.jpg",
    tags: ["soup", "comfort food", "winter"],
    videoSource: {
      create: {
        platform: "YouTube",
        url: "https://youtube.com/watch?v=example5",
      },
    },
  },
  {
    title: "Greek Moussaka",
    description:
      "Layers of eggplant, spiced lamb, and creamy béchamel sauce baked to golden perfection.",
    cuisine: "Greek",
    difficulty: "Hard",
    cookTime: 75,
    prepTime: 45,
    servings: 8,
    ingredients: [
      "eggplant",
      "ground lamb",
      "tomatoes",
      "onion",
      "cinnamon",
      "allspice",
      "milk",
      "flour",
      "butter",
      "nutmeg",
    ],
    instructions: [
      "Slice and salt eggplant, let drain 30 minutes",
      "Brown lamb with onions and spices",
      "Add tomatoes and simmer",
      "Fry eggplant slices until golden",
      "Make béchamel sauce",
      "Layer and bake at 350°F for 45 minutes",
    ],
    image: "/recipes/moussaka.jpg",
    tags: ["casserole", "comfort food", "make ahead"],
    videoSource: {
      create: {
        platform: "Instagram",
        url: "https://instagram.com/reel/example3",
      },
    },
  },
  {
    title: "Simple Avocado Toast",
    description:
      "Creamy mashed avocado on crispy sourdough with everything bagel seasoning and a poached egg.",
    cuisine: "American",
    difficulty: "Easy",
    cookTime: 10,
    prepTime: 5,
    servings: 1,
    ingredients: [
      "sourdough bread",
      "avocado",
      "egg",
      "everything bagel seasoning",
      "lemon",
      "red pepper flakes",
    ],
    instructions: [
      "Toast sourdough until golden and crispy",
      "Mash avocado with lemon juice and salt",
      "Poach egg in simmering water",
      "Spread avocado on toast",
      "Top with poached egg",
      "Sprinkle with seasonings",
    ],
    image: "/recipes/avocado-toast.jpg",
    tags: ["breakfast", "healthy", "quick meal"],
    videoSource: {
      create: {
        platform: "TikTok",
        url: "https://tiktok.com/@example/video/101",
      },
    },
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.videoSource.deleteMany();
  await prisma.recipe.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create recipes
  for (const recipe of recipesData) {
    await prisma.recipe.create({
      data: recipe,
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

