import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";
import { HFDataset } from "@/lib/types";

interface DatasetSelectionCardProps {
  dataset: HFDataset | null;
  setDataset: (dataset: HFDataset) => void;
  features: string[];
  data: any[];
}

export function DatasetSelectionCard({ 
  dataset, 
  setDataset, 
  features, 
  data 
}: DatasetSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Select Your Dataset</CardTitle>
        <CardDescription>Choose a Hugging Face dataset to use as a base.</CardDescription>
      </CardHeader>
      <CardContent>
        <DatasetInput dataset={dataset} setDataset={setDataset} />
        {dataset && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Dataset Preview</h3>
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
              <DatasetViewer features={features} data={data} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}