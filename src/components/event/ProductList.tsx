import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from '@/styles/components/productListStyles';
import relatedProductService, { RelatedProduct } from '@/services/relatedProductService';

interface ProductListProps {
  products: RelatedProduct[];
  onRemoveProduct: (productId: string) => void;
  horizontal?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onRemoveProduct,
  horizontal = true,
}) => {
  // Handle product deletion with safety checks
  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId) {
      console.warn('Cannot delete product: Missing ID');
      return;
    }
    try {
      await relatedProductService.deleteProduct(productId);
      console.log(`Product with ID ${productId} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting product:', error);
      return;
    }

    onRemoveProduct(productId);
  };

  const renderProductItem = ({ item }: { item: RelatedProduct }) => (
    <View
      style={[
        styles.productCard,
        horizontal
          ? { width: 200, marginRight: 12 }
          : { width: '100%', marginBottom: 12 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}€</Text>
        {item.link && (
          <Text
            style={[styles.productLink, { marginTop: 4 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.link}
          </Text>
        )}
      </View> 
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteProduct(item.id)}
      >
        <FontAwesome name="trash" size={18} color="red" />
      </TouchableOpacity>
    </View>
  );

  if (products.length === 0) {
    return (
      <Text style={styles.emptyMessage}>
        No products added yet. Add some using the form.
      </Text>
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProductItem}
      keyExtractor={(item) => item.id || `temp_${Math.random()}`}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        horizontal
          ? styles.horizontalContentContainer
          : styles.verticalContentContainer
      }
      snapToInterval={horizontal ? 212 : undefined}
      snapToAlignment={horizontal ? 'start' : undefined}
      decelerationRate={horizontal ? 'fast' : undefined}
    />
  );
};



export default ProductList;
