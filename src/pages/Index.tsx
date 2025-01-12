import React from 'react';
import ShiptAutomation from '@/components/ShiptAutomation';

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Shipt Automation</h1>
        <ShiptAutomation />
      </div>
    </div>
  );
};

export default Index;