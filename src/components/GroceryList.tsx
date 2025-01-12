import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GroceryListProps {
  onSubmit?: (groceryList: string) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ onSubmit }) => {
  const [groceryList, setGroceryList] = React.useState('');
  const { toast } = useToast();

  const parseGroceryList = (text: string): string[] => {
    // Split the text into lines and process each line
    const lines = text.split('\n');
    const items = new Set<string>();

    lines.forEach(line => {
      // Remove common markers and clean up the line
      const cleanLine = line
        .replace(/^[-*•]|\d+\.|Day \d+:|:/g, '') // Remove bullets, numbers, "Day X:", and colons
        .trim();

      if (cleanLine) {
        // Split on common separators and extract ingredients
        const ingredients = cleanLine.split(/(?:with|,|and)/i)
          .map(item => item.trim())
          .filter(item => 
            item && 
            !item.match(/^(at|for|until|about|or|the|to|[0-9]+°F|[0-9]+\s*minutes?|internal temperature)/i)
          );

        ingredients.forEach(ingredient => {
          // Remove cooking instructions and measurements
          const cleanIngredient = ingredient
            .replace(/smoke[d]?\s+|season[ed]?\s+|marinate[d]?\s+|cook[ed]?\s+|for\s+.*|until\s+.*|with\s+.*/i, '')
            .replace(/\(.*\)/g, '')
            .trim();

          if (cleanIngredient && cleanIngredient.length > 1) {
            items.add(cleanIngredient);
          }
        });
      }
    });

    return Array.from(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryList.trim()) {
      toast({
        title: "Error",
        description: "Please enter a grocery list",
        variant: "destructive",
      });
      return;
    }
    
    const parsedItems = parseGroceryList(groceryList).join('\n');
    
    if (onSubmit) {
      onSubmit(parsedItems);
    } else {
      toast({
        title: "Success",
        description: "Grocery list parsed successfully",
      });
    }

    // Show the parsed items in a toast
    toast({
      title: "Parsed Items",
      description: (
        <div className="mt-2 space-y-1">
          {parseGroceryList(groceryList).map((item, index) => (
            <div key={index} className="text-sm">• {item}</div>
          ))}
        </div>
      ),
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Enter Your Grocery List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Paste your recipe or grocery list in any format..."
            value={groceryList}
            onChange={(e) => setGroceryList(e.target.value)}
            className="min-h-[200px]"
          />
          <Button type="submit" className="w-full">
            Parse List
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GroceryList;