import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { HFDataset } from "@/lib/types";

const formSchema = z.object({
  datasetName: z.string().min(3, "Dataset name must be at least 3 characters."),
  modelId: z.string().min(1, "Model is required."),
  maxTokens: z.coerce.number().min(1, "Max tokens must be at least 1."),
  inputFeature: z.string().min(1, "Input feature is required."),
  isStructured: z.boolean(),
  prompt: z.string().includes("{input}"),
  visibility: z.coerce.number().int().min(0).max(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
}).refine(data => {
  if (data.visibility === 0 && (data.price === undefined || data.price < 0)) {
    return false;
  }
  return true;
}, {
  message: "Price must be a non-negative number for public datasets.",
  path: ["price"],
});

export type FormData = z.infer<typeof formSchema>;

export function useDatasetForm() {
  const searchParams = useSearchParams();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      datasetName: "",
      modelId: "",
      maxTokens: 100,
      inputFeature: "",
      isStructured: false,
      prompt: "",
      visibility: 0,
      description: "",
      price: 0,
    },
    mode: "onChange",
  });

  // Prefill form from URL parameters
  useEffect(() => {
    const prefillFromParams = () => {
      const datasetName = searchParams.get("datasetName");
      if (datasetName) form.setValue("datasetName", datasetName, { shouldValidate: true });

      const modelId = searchParams.get("modelId");
      if (modelId) form.setValue("modelId", modelId, { shouldValidate: true });

      const maxTokens = searchParams.get("maxTokens");
      if (maxTokens) form.setValue("maxTokens", Number(maxTokens), { shouldValidate: true });

      const inputFeature = searchParams.get("inputFeature");
      if (inputFeature) form.setValue("inputFeature", inputFeature, { shouldValidate: true });

      const prompt = searchParams.get("prompt");
      if (prompt) form.setValue("prompt", prompt, { shouldValidate: true });

      const visibility = searchParams.get("visibility");
      if (visibility) form.setValue("visibility", Number(visibility), { shouldValidate: true });

      const description = searchParams.get("description");
      if (description) form.setValue("description", description, { shouldValidate: true });

      const price = searchParams.get("price");
      if (price) form.setValue("price", Number(price), { shouldValidate: true });
    };

    if (searchParams.toString()) {
      prefillFromParams();
    }
  }, [searchParams, form]);

  return { form, formSchema };
}