import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { FormData } from "@/hooks/useDatasetForm";

interface DatasetDetailsCardProps {
  control: Control<FormData>;
  visibility: number;
}

export function DatasetDetailsCard({ control, visibility }: DatasetDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Finalize Dataset Details</CardTitle>
        <CardDescription>
          Provide the final details for your dataset before minting it on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="datasetName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome AI Dataset" {...field} />
              </FormControl>
              <FormDescription>
                This name will be used to identify your dataset on-chain.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of your dataset..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Provide an optional description for your dataset.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="visibility"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Dataset Visibility</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value, 10))} 
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Public (Sellable)</SelectItem>
                    <SelectItem value="1">Private (Not Sellable)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Public datasets can be discovered and purchased by others.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {visibility === 0 && (
            <FormField
              control={control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Price (in USDC)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="e.g., 1 USDC"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the price for accessing your public dataset (in USDC). 1 USDC = 1,000,000 MIST.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}