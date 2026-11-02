import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecipeFormApi } from "./form-utils";

type VideoPlatform = "YouTube" | "Instagram" | "TikTok";

export function VideoSourceField({ form }: Readonly<{ form: RecipeFormApi }>) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <form.Field name="videoSource.platform">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="video-platform">Plataforma del vídeo</Label>
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
                <SelectTrigger id="video-platform" className="w-full">
                  <SelectValue placeholder="Selecciona plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
        <form.Field name="videoSource.url">
          {(field) => (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="video-url">Enlace al vídeo</Label>
              <Input
                id="video-url"
                type="url"
                value={field.state.value || ""}
                onChange={(e) => {
                  field.handleChange(e.target.value);
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
                placeholder="https://…"
              />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}
