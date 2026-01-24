#!/usr/bin/env node
/**
 * RunPod Serverless Endpoint Setup & Management
 * Creates and manages ComfyUI serverless endpoints via API
 * 
 * Usage:
 *   node app/scripts/runpod-serverless-setup.mjs templates     # List available templates
 *   node app/scripts/runpod-serverless-setup.mjs endpoints     # List your endpoints
 *   node app/scripts/runpod-serverless-setup.mjs create        # Create ComfyUI endpoint
 *   node app/scripts/runpod-serverless-setup.mjs delete <id>   # Delete endpoint
 *   node app/scripts/runpod-serverless-setup.mjs test <id>     # Test endpoint with simple job
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const REST_API_URL = 'https://api.runpod.ai/v2';  // Note: .ai not .io for serverless
const GRAPHQL_URL = 'https://api.runpod.io/graphql';

// ============================================
// API Helpers
// ============================================

async function restRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RUNPOD_API_KEY}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${REST_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RUNPOD_API_KEY}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
  }
  return result;
}

// ============================================
// Template Management
// ============================================

async function listTemplates() {
  console.log('📋 Fetching available templates...\n');
  
  // Use GraphQL to get templates (including public ones from hub)
  const query = `
    query {
      myself {
        podTemplates {
          id
          name
          imageName
          isServerless
        }
      }
    }
  `;
  
  const result = await graphqlRequest(query);
  
  if (result.data?.myself?.podTemplates) {
    const templates = result.data.myself.podTemplates;
    console.log(`Found ${templates.length} templates:\n`);
    
    for (const t of templates) {
      console.log(`  📦 ${t.name}`);
      console.log(`     ID: ${t.id}`);
      console.log(`     Image: ${t.imageName}`);
      console.log(`     Serverless: ${t.isServerless ? '✅' : '❌'}`);
      console.log('');
    }
    
    return templates;
  }
  
  return [];
}

async function createServerlessTemplate() {
  console.log('🔧 Creating ComfyUI serverless template...\n');
  
  // Based on RunPod docs: saveTemplate with direct arguments (not input object)
  const query = `
    mutation {
      saveTemplate(
        name: "elena-comfyui-worker"
        imageName: "timpietruskyblibla/runpod-worker-comfy:3.6.0-sdxl"
        containerDiskInGb: 20
        volumeInGb: 0
        dockerArgs: ""
        isServerless: true
        env: [
          { key: "COMFY_POLLING_MAX_RETRIES", value: "600" },
          { key: "COMFY_POLLING_INTERVAL_MS", value: "500" }
        ]
      ) {
        id
        name
        imageName
      }
    }
  `;
  
  const result = await graphqlRequest(query);
  
  if (result.data?.saveTemplate) {
    const template = result.data.saveTemplate;
    console.log('✅ Serverless template created!\n');
    console.log(`  ID: ${template.id}`);
    console.log(`  Name: ${template.name}`);
    console.log(`  Image: ${template.imageName}`);
    return template;
  }
  
  console.error('GraphQL result:', JSON.stringify(result, null, 2));
  console.error('❌ Failed to create serverless template');
  return null;
}

// ============================================
// Endpoint Management
// ============================================

async function listEndpoints() {
  console.log('📋 Fetching your serverless endpoints...\n');
  
  const query = `
    query {
      myself {
        endpoints {
          id
          name
          templateId
          gpuIds
          workersMin
          workersMax
          idleTimeout
          locations
        }
      }
    }
  `;
  
  const result = await graphqlRequest(query);
  
  if (result.data?.myself?.endpoints) {
    const endpoints = result.data.myself.endpoints;
    
    if (endpoints.length === 0) {
      console.log('No serverless endpoints found.\n');
      console.log('Create one with: node app/scripts/runpod-serverless-setup.mjs create');
      return [];
    }
    
    console.log(`Found ${endpoints.length} endpoint(s):\n`);
    
    for (const e of endpoints) {
      console.log(`  🚀 ${e.name}`);
      console.log(`     ID: ${e.id}`);
      console.log(`     Template: ${e.templateId}`);
      console.log(`     GPU: ${e.gpuIds}`);
      console.log(`     Workers: ${e.workersMin}-${e.workersMax}`);
      console.log(`     Idle timeout: ${e.idleTimeout}s`);
      console.log(`     Locations: ${e.locations || 'Any'}`);
      console.log('');
    }
    
    return endpoints;
  }
  
  return [];
}

async function createEndpoint(templateId) {
  console.log('🚀 Creating ComfyUI serverless endpoint...\n');
  
  // If no templateId provided, try to find or create one
  if (!templateId) {
    // First check for existing serverless templates
    const serverlessTemplatesQuery = `
      query {
        myself {
          serverlessTemplates {
            id
            name
            imageName
          }
        }
      }
    `;
    
    const serverlessResult = await graphqlRequest(serverlessTemplatesQuery);
    const serverlessTemplates = serverlessResult.data?.myself?.serverlessTemplates || [];
    
    console.log(`Found ${serverlessTemplates.length} serverless template(s)\n`);
    
    const comfyTemplate = serverlessTemplates.find(t => 
      t.name.toLowerCase().includes('comfy') || t.imageName?.includes('comfy')
    );
    
    if (comfyTemplate) {
      templateId = comfyTemplate.id;
      console.log(`Using existing serverless template: ${comfyTemplate.name} (${templateId})\n`);
    } else {
      console.log('No ComfyUI serverless template found. Creating one...\n');
      const newTemplate = await createServerlessTemplate();
      if (!newTemplate) {
        console.error('❌ Could not create template');
        return null;
      }
      templateId = newTemplate.id;
    }
  }
  
  // Based on RunPod docs: saveEndpoint with input object
  const query = `
    mutation {
      saveEndpoint(input: {
        name: "elena-comfyui"
        templateId: "${templateId}"
        gpuIds: "AMPERE_24"
        workersMin: 0
        workersMax: 1
        idleTimeout: 5
        scalerType: "QUEUE_DELAY"
        scalerValue: 1
      }) {
        id
        name
        templateId
        gpuIds
        workersMin
        workersMax
      }
    }
  `;
  
  const result = await graphqlRequest(query);
  
  if (result.data?.saveEndpoint) {
    const endpoint = result.data.saveEndpoint;
    console.log('✅ Endpoint created!\n');
    console.log(`  ID: ${endpoint.id}`);
    console.log(`  Name: ${endpoint.name}`);
    console.log(`  GPU: ${endpoint.gpuIds}`);
    console.log(`  Workers: ${endpoint.workersMin}-${endpoint.workersMax}`);
    console.log('');
    console.log('📝 Next steps:');
    console.log(`  1. Note your endpoint ID: ${endpoint.id}`);
    console.log('  2. Upload your models (LoRA, checkpoint) to RunPod Network Volume');
    console.log('  3. Test with: node app/scripts/runpod-serverless-setup.mjs test ' + endpoint.id);
    console.log('');
    console.log('⚠️  Important: The default ComfyUI worker uses FLUX.1-dev.');
    console.log('    For SDXL + BigLove + Elena LoRA, you need a custom Docker image.');
    return endpoint;
  }
  
  console.error('❌ Failed to create endpoint');
  console.error(JSON.stringify(result, null, 2));
  return null;
}

async function deleteEndpoint(endpointId) {
  console.log(`🗑️ Deleting endpoint ${endpointId}...\n`);
  
  const query = `
    mutation DeleteEndpoint($id: String!) {
      deleteEndpoint(id: $id)
    }
  `;
  
  const result = await graphqlRequest(query, { id: endpointId });
  
  if (result.data?.deleteEndpoint) {
    console.log('✅ Endpoint deleted');
  } else {
    console.error('❌ Failed to delete endpoint');
  }
}

// ============================================
// Job Execution
// ============================================

async function testEndpoint(endpointId) {
  console.log(`🧪 Testing endpoint ${endpointId}...\n`);
  
  // Simple test workflow - just returns workflow info
  const testPayload = {
    input: {
      workflow_json: {
        // Minimal test - CheckpointLoaderSimple only
        "3": {
          "class_type": "CheckpointLoaderSimple",
          "inputs": {
            "ckpt_name": "sd_xl_base_1.0.safetensors"
          }
        }
      }
    }
  };
  
  try {
    // Submit job
    console.log('Submitting test job...');
    const runResponse = await fetch(`${REST_API_URL}/${endpointId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_API_KEY}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const runResult = await runResponse.json();
    console.log('Job submitted:', runResult);
    
    if (runResult.id) {
      console.log(`\nJob ID: ${runResult.id}`);
      console.log('Status: ' + runResult.status);
      
      // Poll for result
      console.log('\nPolling for result...');
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`${REST_API_URL}/${endpointId}/status/${runResult.id}`, {
          headers: {
            'Authorization': `Bearer ${RUNPOD_API_KEY}`
          }
        });
        
        const status = await statusResponse.json();
        console.log(`  [${attempts}s] Status: ${status.status}`);
        
        if (status.status === 'COMPLETED') {
          console.log('\n✅ Test completed!');
          console.log('Output:', JSON.stringify(status.output, null, 2));
          return status;
        }
        
        if (status.status === 'FAILED') {
          console.log('\n❌ Test failed!');
          console.log('Error:', status.error);
          return status;
        }
        
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
      }
      
      console.log('\n⏱️ Test timed out after 60 seconds');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================
// Main
// ============================================

async function main() {
  if (!RUNPOD_API_KEY) {
    console.error('❌ RUNPOD_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  const command = process.argv[2] || 'help';
  const arg = process.argv[3];
  
  switch (command) {
    case 'templates':
      await listTemplates();
      break;
      
    case 'endpoints':
      await listEndpoints();
      break;
      
    case 'create':
      await createEndpoint(arg);
      break;
      
    case 'delete':
      if (!arg) {
        console.log('Please specify endpoint ID: node app/scripts/runpod-serverless-setup.mjs delete <ENDPOINT_ID>');
        await listEndpoints();
      } else {
        await deleteEndpoint(arg);
      }
      break;
      
    case 'test':
      if (!arg) {
        console.log('Please specify endpoint ID: node app/scripts/runpod-serverless-setup.mjs test <ENDPOINT_ID>');
        await listEndpoints();
      } else {
        await testEndpoint(arg);
      }
      break;
      
    default:
      console.log(`
RunPod Serverless Endpoint Manager

Usage:
  node app/scripts/runpod-serverless-setup.mjs <command> [args]

Commands:
  templates           List available templates
  endpoints           List your serverless endpoints
  create [templateId] Create a new ComfyUI endpoint
  delete <endpointId> Delete an endpoint
  test <endpointId>   Test an endpoint with a simple job

Examples:
  node app/scripts/runpod-serverless-setup.mjs templates
  node app/scripts/runpod-serverless-setup.mjs create
  node app/scripts/runpod-serverless-setup.mjs test abc123xyz
`);
  }
}

main().catch(console.error);
