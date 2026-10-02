import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './core';

export async function seedInitialData() {
  try {
    const productsCol = collection(db, 'products');
    const productsSnap = await getDocs(productsCol);
    
    if (productsSnap.empty) {
      console.log('Seeding initial data...');
      
      // Create a sample product
      const sampleProduct = {
        id: 'sample-p1',
        name: 'Producto de Ejemplo',
        sku: 'SAMPLE-001',
        category: 'General',
        costPrice: 100,
        description: 'Este es un producto de prueba para verificar la conexión.',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'products', sampleProduct.id), sampleProduct);
      
      // Create a sample warehouse
      const sampleWarehouse = {
        id: 'sample-w1',
        name: 'Bodega Principal',
        type: 'Bodega',
        location: 'Sede Central',
        capacity: 1000,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'warehouses', sampleWarehouse.id), sampleWarehouse);
      
      // Seed inventory
      await setDoc(doc(db, 'warehouses', sampleWarehouse.id, 'inventory', sampleProduct.id), {
        productId: sampleProduct.id,
        warehouseId: sampleWarehouse.id,
        quantity: 50,
        lastUpdated: serverTimestamp()
      });
      
      console.log('Seeding completed successfully.');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
}
