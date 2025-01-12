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
    
    if (onSubmit) {
      onSubmit(groceryList);
    } else {
      toast({
        title: "Success",
        description: "Grocery list saved successfully",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Enter Your Grocery List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Enter your grocery items (one per line)"
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