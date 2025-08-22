import { getLlama, getLlamaGpuTypes } from 'node-llama-cpp';

async function test() {
  try {
    const llama = await getLlama();
    console.log('Llama module initialized');

    const gpuTypes = await getLlamaGpuTypes();
    console.log('Supported GPU types:', gpuTypes);
  } catch (err) {
    console.error('Error initializing Llama:', err);
  }
}

test();