import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import JsonSchemaInput from "@/components/json-schema-input";
import { AtomaModel, HFDataset } from "@/lib/types";
import { Control } from "react-hook-form";
import { FormData } from "@/hooks/useDatasetForm";
import { z } from "zod";

interface ModelConfigurationCardProps {
  control: Control<FormData>;
  models: AtomaModel[];
  selectedModel: AtomaModel | null;
  dataset: HFDataset | null;
  isStructured: boolean;
  initialJsonSchema: object | null;
  setJsonSchema: (schema: z.ZodObject<any> | null) => void;
}

export function ModelConfigurationCard({
  control,
  models,
  selectedModel,
  dataset,
  isStructured,
  initialJsonSchema,
  setJsonSchema
}: ModelConfigurationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Configure Generation Parameters</CardTitle>
        <CardDescription>Select a model and configure its generation parameters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="modelId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={models.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxTokens"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    max={selectedModel ? selectedModel.max_num_compute_units : undefined}
                    {...field}
                  />
                </FormControl>
                {selectedModel && (
                  <FormDescription>Max for selected model: {selectedModel.max_num_compute_units}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="inputFeature"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Input Feature</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!dataset?.features?.length}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select input feature" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataset?.features.map((feature) => (
                      <SelectItem key={feature} value={feature}>
                        {feature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="isStructured"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center">
                  Structured Output
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="ml-2"
                    />
                  </FormControl>
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {isStructured && (
          <div>
            <h3 className="text-lg font-semibold mb-2 mt-4">JSON Schema</h3>
            <JsonSchemaInput schema={initialJsonSchema} setSchema={setJsonSchema} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}