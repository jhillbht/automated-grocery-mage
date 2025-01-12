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
    const lines = text.split('\n');
    const items = new Set<string>();

    // Common cooking instruction patterns to remove
    const cookingInstructions = /\b(bake|boil|broil|cook|dice|fry|grill|heat|marinate|mince|mix|peel|roast|saute|season|simmer|slice|smoke|stir|toast)\w*\b|\b(at|for|until|about|or|the|to)\b|\d+°[FC]|\d+\s*(minutes?|mins?|hours?|hrs?)|internal temperature/gi;
    
    // Measurement patterns to optionally keep
    const measurements = /\d+(\s*\/\s*\d+)?\s*(cup|cups|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons)/i;

    lines.forEach(line => {
      // Remove bullets, numbers, "Day X:", and colons
      const cleanLine = line
        .replace(/^[-*•]|\d+\.|Day \d+:|:/g, '')
        .trim();

      if (cleanLine) {
        // Split on common separators and extract ingredients
        const ingredients = cleanLine.split(/(?:with|,|and)/i)
          .map(item => item.trim())
          .filter(item => item && !item.match(/^(at|for|until|about|or|the|to)$/i));

        ingredients.forEach(ingredient => {
          // Remove cooking instructions while preserving measurements
          let cleanIngredient = ingredient
            .replace(/\(.*\)/g, '') // Remove parenthetical notes
            .replace(cookingInstructions, '') // Remove cooking instructions
            .trim();

          // Keep the measurement if it exists
          const measurementMatch = cleanIngredient.match(measurements);
          const itemWithoutMeasurement = cleanIngredient.replace(measurements, '').trim();
          
          if (itemWithoutMeasurement && itemWithoutMeasurement.length > 1) {
            // If there was a measurement, add it back to the beginning
            cleanIngredient = measurementMatch 
              ? `${measurementMatch[0]} ${itemWithoutMeasurement}`
              : itemWithoutMeasurement;
            
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
