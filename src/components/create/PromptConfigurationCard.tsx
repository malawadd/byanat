import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DatasetViewer from "@/components/dataset-viewer";
import { Loader2, Sparkles } from "lucide-react";
import { Control } from "react-hook-form";
import { FormData } from "@/hooks/useDatasetForm";

interface PromptConfigurationCardProps {
  control: Control<FormData>;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  wizardPrompt: string;
  setWizardPrompt: (prompt: string) => void;
  wizardPromptGenerated: boolean;
  isPromptGenerating: boolean;
  onGeneratePromptWithWizard: () => void;
  previewData: any[];
  previewFeatures: string[];
  isPreviewLoading: boolean;
  previewAttempts: number;
  maxAttempts: number;
  onTestGeneration: () => void;
  canTestGeneration: boolean;
  currentAccount: string | undefined;
}

export function PromptConfigurationCard({
  control,
  isWizardOpen,
  setIsWizardOpen,
  wizardPrompt,
  setWizardPrompt,
  wizardPromptGenerated,
  isPromptGenerating,
  onGeneratePromptWithWizard,
  previewData,
  previewFeatures,
  isPreviewLoading,
  previewAttempts,
  maxAttempts,
  onTestGeneration,
  canTestGeneration,
  currentAccount
}: PromptConfigurationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Define and Test Your Prompt</CardTitle>
        <FormDescription>
          Write a prompt to guide the AI. Test it on a few samples before full generation. 
          You have {maxAttempts - previewAttempts} attempts remaining.
        </FormDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Generation Prompt</FormLabel>
              <Tabs value={isWizardOpen ? "wizard" : "manual"} onValueChange={(value) => setIsWizardOpen(value === "wizard")}>
                <TabsList>
                  <TabsTrigger value="wizard">Wizard</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>
                <TabsContent value="wizard">
                  <FormControl>
                    <Textarea
                      placeholder="Describe your dataset generation task in a few sentences..."
                      className="min-h-[100px] mt-2"
                      value={wizardPrompt}
                      onChange={(e) => {
                        setWizardPrompt(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your dataset generation task in a few sentences.
                  </FormDescription>
                </TabsContent>
                <TabsContent value="manual">
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the prompt that will guide the generation task..."
                      className="min-h-[100px] mt-2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {"{input}"} to reference the input feature in your prompt.
                  </FormDescription>
                </TabsContent>
              </Tabs>
              <FormMessage />
            </FormItem>
          )}
        />

        {isWizardOpen && wizardPrompt && !wizardPromptGenerated ? (
          <Button 
            type="button"
            className="w-full bg-[#6750A4] hover:bg-[#6750A4]/90"
            size="lg"
            disabled={isPromptGenerating}
            onClick={onGeneratePromptWithWizard}
          >
            {isPromptGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prompt...
              </>
            ) : (
              <>
                Generate Prompt with Wizard
                <Sparkles className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full bg-[#6750A4] hover:bg-[#6750A4]/90"
            size="lg"
            disabled={!canTestGeneration || isPreviewLoading || previewAttempts >= maxAttempts || !currentAccount}
            onClick={onTestGeneration}
          >
            {isPreviewLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : previewAttempts >= maxAttempts ? (
              "Preview Limit Reached"
            ) : (
              `Test Generation With 3 Rows (${maxAttempts - previewAttempts} left)`
            )}
          </Button>
        )}

        {previewData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Preview Results</h3>
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
              <DatasetViewer features={previewFeatures} data={previewData} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}