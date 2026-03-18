import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import ProductList from '@/components/event/ProductList';
import { RelatedProduct } from '@/services/relatedProductService';
import { styles } from '@/styles/screens/products/productListScreenStyles';

const ProductListScreen = () => {
  const router = useRouter();
  const { products: productsParam } = useLocalSearchParams();
  const [products, setProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    // Parse products from URL params
    if (productsParam) {
      try {
        const parsedProducts = JSON.parse(
          typeof productsParam === 'string' ? productsParam : ''
        );
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
      }
    }
  }, [productsParam]);
  
  const handleRemoveProduct = (productId: string) => {
    // Find the product name for better UX in the confirmation dialog
    const productToRemove = products.find(p => p.id === productId);
    
    Alert.alert(
      "Remove Product",
      `Are you sure you want to remove "${productToRemove?.name || 'this product'}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            const updatedProducts = products.filter((product) => product.id !== productId);
            setProducts(updatedProducts);
            
            // Store updated products in params - will be used when navigating back
            router.setParams({
              updatedProducts: JSON.stringify(updatedProducts),
            });
          }
        }
      ]
    );
  };
  
  const handleBackNavigation = () => {
    if (products.length === 0) {
      Alert.alert(
        "No Products",
        "You've removed all products. Do you want to go back?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Go Back", 
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  return (    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackNavigation}
        >
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {products.length > 0 ? `Products (${products.length})` : 'No Products'}
        </Text>
      </View>
      
      <View style={styles.listContainer}>
        {products.length > 0 ? (
          <ProductList 
            products={products} 
            onRemoveProduct={handleRemoveProduct}
            horizontal={false} 
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="shopping-cart" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products have been added</Text>
            <TouchableOpacity 
              style={styles.backToFormButton}
              onPress={handleBackNavigation}
            >
              <Text style={styles.backToFormText}>Back to Form</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};



export default ProductListScreen;
