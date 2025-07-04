import Link from "next/link";
import { cn } from "@/lib/utils";
import Name from "@/components/name";
import Avatar from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { MIST_PER_USDC } from "@/lib/constants";
import type { DatasetObject } from "@/lib/types";
import { Download, Eye, FileText, Lock, Unlock, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const stringToHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

const getGradientClasses = (name: string): [string, string] => {
  const colors = [
    "neon-green",
    "neon-cyan", 
    "neon-magenta",
    "neon-yellow",
    "neon-blue",
  ];
  const hash = stringToHash(name);
  const startColorIndex = Math.abs(hash) % colors.length;
  const endColorIndex = Math.abs(hash >> 8) % colors.length;
  const startColor = `from-${colors[startColorIndex]}`;
  const endColor = `to-${colors[endColorIndex]}`;
  return [startColor, endColor];
}

export function DatasetList({ datasets, currentAddress, resolveNameServiceNames }: { 
  datasets: DatasetObject[], 
  currentAddress?: string, 
  resolveNameServiceNames: (address: string) => Promise<string> 
}) {
  const getShortModelName = (modelName: string) => {
    return modelName.split("/").pop();
  }

  const hasAccess = (dataset: DatasetObject) => {
    return currentAddress && (currentAddress === dataset.owner || dataset.allowlist.includes(currentAddress));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {datasets.map((dataset) => {
        const userHasAccess = hasAccess(dataset);
        const [startColor, endColor] = getGradientClasses(dataset.name);
        
        return (
          <Link href={`/dataset/${dataset.id}`} key={dataset.id}>
            <div className="relative group h-full">
              {userHasAccess && (
                <div
                  className={cn(
                    "absolute -inset-0.5 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 bg-gradient-to-r opacity-25",
                    startColor,
                    endColor
                  )}
                />
              )}
              
              <Card className="h-full hud-panel hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                <div className="scan-lines absolute inset-0 opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20"></div>
                
                <CardHeader className="pb-4 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="status-indicator"></div>
                        <Badge 
                          variant={dataset.visibility.inner === 0 ? "secondary" : "outline"}
                          className={`command-text text-xs ${
                            dataset.visibility.inner === 0 
                              ? "bg-neon-green/20 text-neon-green border-neon-green" 
                              : "bg-neon-magenta/20 text-neon-magenta border-neon-magenta"
                          }`}
                        >
                          {dataset.visibility.inner === 0 ? (
                            <><Unlock className="w-3 h-3 mr-1" />PUBLIC</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" />PRIVATE</>
                          )}
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-lg neon-text text-neon-green command-text">
                        {dataset.name.toUpperCase()}
                      </CardTitle>
                      
                      <CardDescription className="text-sm mt-2">
                        <div className="flex items-center space-x-2">
                          <Avatar address={dataset.owner} />
                          <Name 
                            address={dataset.owner} 
                            resolveNameServiceNames={resolveNameServiceNames} 
                          />
                        </div>
                      </CardDescription>
                    </div>
                    
                    <Activity className="w-5 h-5 text-neon-cyan animate-pulse" />
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4 relative">
                  <p className="text-sm text-neon-cyan/70 line-clamp-3 mb-4 command-text">
                    {dataset.description || "NO DESCRIPTION AVAILABLE"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 bg-black/30 border-neon-green/30 text-neon-green command-text text-xs"
                    >
                      <FileText className="h-3 w-3" />
                      {dataset.metadata.numRows.toLocaleString()}
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 bg-black/30 border-neon-cyan/30 text-neon-cyan command-text text-xs"
                    >
                      {dataset.hfMetadata.config}/{dataset.hfMetadata.split}
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 bg-black/30 border-neon-magenta/30 text-neon-magenta command-text text-xs col-span-2"
                    >
                      {getShortModelName(dataset.modelMetadata.name)}
                    </Badge>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4 border-t border-neon-green/20 relative">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4 text-xs command-text">
                      <div className="flex items-center gap-1 text-neon-cyan">
                        <Download className="h-3 w-3" />
                        <span>{dataset.stats.numDownloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-neon-green">
                        <Eye className="h-3 w-3" />
                        <span>v{dataset.version}</span>
                      </div>
                    </div>
                    
                    {dataset.price > 0 && (
                      <div className="command-text text-neon-magenta font-bold">
                        ${(dataset.price / MIST_PER_USDC).toFixed(2)}
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </Link>
        )
      })}
    </div>
  )
}