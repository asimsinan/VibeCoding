/**
 * Intermediate App Component for Gradual Migration
 * Based on web search recommendations for fixing Vercel deployment issues
 */

import React, { useState, useEffect } from 'react';

const AppIntermediate: React.FC = () => {
  // const [step, setStep] = useState(1); // For future use
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Intermediate App: Starting step-by-step test...');
    
    const testSteps = async () => {
      try {
        // Step 1: Test basic API
        console.log('🔄 Step 1: Testing basic API...');
        const healthResponse = await fetch('https://personal-shopping-assistant.vercel.app/api/v1/health');
        const healthData = await healthResponse.json();
        console.log('✅ Step 1: Health API successful', healthData);
        
        // Step 2: Test products API
        console.log('🔄 Step 2: Testing products API...');
        const productsResponse = await fetch('https://personal-shopping-assistant.vercel.app/api/v1/products?limit=3');
        const productsData = await productsResponse.json();
        console.log('✅ Step 2: Products API successful', productsData);
        
        setData({
          health: healthData,
          products: productsData
        });
        setLoading(false);
      } catch (err) {
        console.error('❌ Intermediate App: Test failed', err);
        setError(`Test failed: ${err}`);
        setLoading(false);
      }
    };

    testSteps();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Testing intermediate app...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ color: 'red' }}>Error: {error}</h1>
        <p>Check console for details</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333' }}>✅ Intermediate App Working!</h1>
      <p>This version tests both health and products APIs.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Health API Result:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {JSON.stringify(data?.health, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Products API Result:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {JSON.stringify(data?.products, null, 2)}
        </pre>
      </div>

      <p style={{ marginTop: '20px', color: '#666' }}>
        If you can see this, both APIs are working on Vercel.
      </p>
    </div>
  );
};

export default AppIntermediate;
