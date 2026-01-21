"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { useForm } from "@tanstack/react-form";
import { Copy, Plus, Trash2, Wand2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

type VideoPlatform = "YouTube" | "Instagram" | "TikTok";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  cuisine: z.string().min(1, "Cuisine is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  cookTime: z.number().min(0),
  prepTime: z.number().min(0),
  servings: z.number().min(1),
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(z.string())
    .min(1, "At least one instruction is required"),
  image: z.string().min(1, "Image URL/Path is required"),
  tags: z.array(z.string()),
  videoSource: z
    .object({
      platform: z.enum(["YouTube", "Instagram", "TikTok"]),
      url: z.string().url("Must be a valid URL"),
    })
    .optional(),
});

type RecipeFormValues = z.infer<typeof formSchema>;

export default function NewRecipePage() {
  const router = useRouter();
  const utils = api.useUtils();
  const createRecipe = api.recipe.create.useMutation({
    onSuccess: () => {
      toast.success("Recipe created successfully");
      router.push("/");
      router.refresh();
      utils.recipe.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      cuisine: "",
      difficulty: "Medium",
      cookTime: 0,
      prepTime: 0,
      servings: 1,
      ingredients: [""] as string[],
      instructions: [""] as string[],
      image: "",
      tags: [] as string[],
    } as RecipeFormValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const cleanedValue = {
        ...value,
        ingredients: value.ingredients.filter((i) => i.trim() !== ""),
        instructions: value.instructions.filter((i) => i.trim() !== ""),
        tags: value.tags.filter((t) => t.trim() !== ""),
      };
      createRecipe.mutate(cleanedValue);
    },
  });

  const [jsonInput, setJsonInput] = useState("");
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      let videoSource = parsed.videoSource;
      if (videoSource && videoSource.create) {
        videoSource = videoSource.create;
      }

      form.setFieldValue("title", parsed.title || "");
      form.setFieldValue("description", parsed.description || "");
      form.setFieldValue("cuisine", parsed.cuisine || "");
      form.setFieldValue("difficulty", parsed.difficulty || "Medium");
      form.setFieldValue("cookTime", parsed.cookTime || 0);
      form.setFieldValue("prepTime", parsed.prepTime || 0);
      form.setFieldValue("servings", parsed.servings || 2);
      form.setFieldValue("ingredients", parsed.ingredients || [""]);
      form.setFieldValue("instructions", parsed.instructions || [""]);
      form.setFieldValue("image", parsed.image || "");
      form.setFieldValue("tags", parsed.tags || []);
      if (videoSource) {
        form.setFieldValue("videoSource", {
          platform: videoSource.platform,
          url: videoSource.url,
        });
      } else {
        form.setFieldValue("videoSource", undefined);
      }

      setIsJsonDialogOpen(false);
      setJsonInput("");
      toast.success("Recipe data imported successfully");
    } catch (e) {
      toast.error("Invalid JSON format");
    }
  };

  const copyPrompt = () => {
    const prompt = `You are an expert data extraction assistant. Your task is to transform raw recipe text (typically from social media captions like Instagram or TikTok) into a structured JSON object.

**Input Data:**
You will receive:

1. The Platform and URL of the video.
2. The raw text description of the recipe (ingredients, steps, etc.).

**Output Rules:**

1. **Format:** Return **only** the raw JSON object. Do not wrap it in markdown code blocks if possible, and do not add conversational text.
2. **Language:**
* **JSON Keys:** English.
* **Content Values** (Title, Description, Ingredients, Instructions, Cuisine): **Spanish**.
* **Tags & Difficulty:** **English**.


3. **Field Specifics:**
*
*
*
*


**JSON Structure Template:**


`;
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Recipe</h1>
          <p className="text-muted-foreground mt-2">
            Add a new recipe to your collection.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyPrompt}>
            <Copy className="mr-2 h-4 w-4" />
            Copy AI Prompt
          </Button>
          <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Recipe JSON</DialogTitle>
                <DialogDescription>
                  Paste the JSON generated by the AI assistant below.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[300px] font-mono text-xs"
                placeholder='{ "title": "..." }'
              />
              <DialogFooter>
                <Button onClick={handleImportJson}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <form.Field
          name="title"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Title</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Recipe Title"
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Recipe description..."
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form.Field
            name="cuisine"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Cuisine</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Italian"
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="difficulty"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Difficulty</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val: "Easy" | "Medium" | "Hard") =>
                    field.handleChange(val)
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <form.Field
            name="prepTime"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Prep Time (min)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={0}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="cookTime"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Cook Time (min)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={0}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="servings"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Servings</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={1}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>

        {/* Ingredients Array */}
        <form.Field
          name="ingredients"
          mode="array"
          children={(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                </Button>
              </div>
              {field.state.value.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <form.Field
                    name={`ingredients[${index}]`}
                    children={(subField) => (
                      <Input
                        value={subField.state.value}
                        onBlur={subField.handleBlur}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        {/* Instructions Array */}
        <form.Field
          name="instructions"
          mode="array"
          children={(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Instructions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Step
                </Button>
              </div>
              {field.state.value.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-2 w-6 text-sm font-medium">
                    {index + 1}.
                  </span>
                  <form.Field
                    name={`instructions[${index}]`}
                    children={(subField) => (
                      <Textarea
                        value={subField.state.value}
                        onBlur={subField.handleBlur}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        className="min-h-[80px]"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(index)}
                    disabled={field.state.value.length === 1}
                  >
                    <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        {/* Tags Array */}
        <form.Field
          name="tags"
          mode="array"
          children={(field) => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Tags</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue("")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {field.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 flex items-center gap-2 rounded-md p-1"
                  >
                    <form.Field
                      name={`tags[${index}]`}
                      children={(subField) => (
                        <Input
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                          placeholder="Tag"
                          className="h-8 w-32 border-none bg-transparent px-2 shadow-none focus-visible:ring-0"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => field.removeValue(index)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        <form.Field
          name="image"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Image Path / URL</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="/recipes/my-recipe.png or https://..."
              />
              <p className="text-muted-foreground text-xs">
                For local images, place them in public/recipes and use the path
                like /recipes/image.png
              </p>
              {field.state.meta.errors ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        />

        {/* Video Source */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Video Source (Optional)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <form.Field
              name="videoSource.platform"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: VideoPlatform) => {
                      field.handleChange(val);
                      // If platform is selected, ensure we initialize the object if it was undefined
                      if (!form.getFieldValue("videoSource")) {
                        form.setFieldValue("videoSource", {
                          platform: val,
                          url: "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <form.Field
              name="videoSource.url"
              children={(field) => (
                <div className="space-y-2 md:col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={field.state.value || ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      // If url is typed, ensure object exists. Note: platform might be missing if user types URL first, need to handle that or force platform selection.
                      // Validation handles missing platform if videoSource object exists.
                      const currentPlatform = form.getFieldValue(
                        "videoSource.platform",
                      );
                      if (!form.getFieldValue("videoSource")) {
                        form.setFieldValue("videoSource", {
                          platform: currentPlatform || "Instagram",
                          url: e.target.value,
                        });
                      }
                    }}
                    placeholder="https://..."
                  />
                </div>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={createRecipe.isPending}>
            {createRecipe.isPending ? "Creating..." : "Create Recipe"}
          </Button>
        </div>
      </form>

      {/* Image Generation Help */}
      <div className="bg-muted/50 mt-12 rounded-lg border p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Wand2 className="h-5 w-5" />
          How to generate an image?
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          You can use the JSON to ask an AI to generate an image. Use a prompt
          like:
        </p>
        <div className="bg-background group relative rounded-md border p-4 font-mono text-sm">
          "Generate a photorealistic food photography image for a recipe with
          this title: [Title] and description: [Description]. Top-down view,
          high quality."
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => {
              navigator.clipboard.writeText(
                "Generate a photorealistic food photography image for a recipe with this title: [Title] and description: [Description]. Top-down view, high quality.",
              );
              toast.success("Image prompt copied");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
