import React from 'react';
import GroceryList from '@/components/GroceryList';
import AutomationStatus from '@/components/AutomationStatus';
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { automationService } from '@/services/automationService';

const Index = () => {
  const [status, setStatus] = React.useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = React.useState(0);
  const { toast } = useToast();

  const startAutomation = async () => {
    try {
      setStatus('running');
      const initialized = await automationService.initialize();
      if (!initialized) throw new Error('Failed to initialize browser');
      
      setProgress(25);
      await automationService.navigateToShipt();
      setProgress(50);
      
      // More automation steps would go here
      
      setProgress(100);
      setStatus('completed');
      toast({
        title: "Success",
        description: "Automation completed successfully",
      });
    } catch (error) {
      setStatus('error');
      toast({
        title: "Error",
        description: "Automation failed: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const stopAutomation = async () => {
    await automationService.close();
    setStatus('idle');
    setProgress(0);
    toast({
      title: "Stopped",
      description: "Automation stopped successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Shipt Automation</h1>
        
        <div className="grid gap-8">
          <GroceryList />
          
          <div className="flex flex-col items-center space-y-4">
            <AutomationStatus status={status} progress={progress} />
            
            <div className="flex gap-4">
              <Button
                onClick={startAutomation}
                disabled={status === 'running'}
                className="w-32"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
              
              <Button
                onClick={stopAutomation}
                disabled={status !== 'running'}
                variant="destructive"
                className="w-32"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;