import { SyntheticDataResultItem } from "@/lib/types";

export const sanitizeDataset = (
  datasetToSanitize: SyntheticDataResultItem[],
  inputFeature: string
): Uint8Array => {
  const rows = datasetToSanitize.map((item, index) => ({
    row_idx: index,
    row: {
      [`${inputFeature || 'input'}`]: item.input,
      "generated_output": item.data
    },
    signature: item.signature,
    response_hash: item.responseHash,
    truncated_cells: []
  }));

  const jsonData = {
    features: [
      { feature_idx: 0, name: inputFeature || 'input', type: { dtype: "string", _type: "Value" } },
      { feature_idx: 1, name: "generated_output", type: { dtype: "string", _type: "Value" } }
    ],
    rows: rows,
    num_rows_total: rows.length,
    num_rows_per_page: 100,
    partial: false
  };

  const jsonString = JSON.stringify(jsonData);
  return new TextEncoder().encode(jsonString);
};

export const colorFromAddress = (address: string): string => {
  const colors = [
    "#F87171",
    "#FBBF24",
    "#FCD34D",
    "#4ADE80",
    "#3B82F6",
  ];

  return colors[parseInt(address.slice(0, 8), 16) % colors.length];
};