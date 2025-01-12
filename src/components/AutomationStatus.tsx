import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AutomationStatusProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({ status, progress }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Automation Status
          <Badge className={getStatusColor()}>{status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            {progress}% Complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationStatus;